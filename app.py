import os, json, time, requests
import http.client
from dotenv import load_dotenv
from flask import Flask, render_template, redirect, url_for, request, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, auth_required, UserMixin, RoleMixin

load_dotenv()

app = Flask(__name__)

# Configurations for Flask security
if not os.environ.get('SECRET_KEY') or not os.environ.get('SECURITY_PASSWORD_SALT'):
    raise RuntimeError(
        "Missing SECRET_KEY or SECURITY_PASSWORD_SALT environment variables. ")

# Configurations for API calling
API_KEY = os.environ.get("API_FOOTBALL_KEY")
if not API_KEY:
    raise RuntimeError("API_FOOTBALL_KEY is missing. Check your .env file.")

BASE_URL = "https://v3.football.api-sports.io"
HEADERS = {
    "x-apisports-key": API_KEY
}

app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
app.config['SECURITY_USERNAME_ENABLE'] = True
app.config['SECURITY_USERNAME_REQUIRED'] = True
app.config['SECURITY_PASSWORD_SALT'] = os.environ['SECURITY_PASSWORD_SALT']
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
app.config['SECURITY_RECOVERABLE'] = False # For now. Fewer features for now is better
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Flask-Security feature settings
app.config['SECURITY_REGISTERABLE'] = True
app.config['SECURITY_SEND_REGISTER_EMAIL'] = False # For now. Fewer features for now is better.
app.config['SECURITY_EMAIL_VALIDATOR_ARGS'] = {'check_deliverability': False}

# Security URLs
app.config['SECURITY_LOGIN_URL'] = '/login'
app.config['SECURITY_REGISTER_URL'] = '/signup'
app.config['SECURITY_LOGOUT_URL'] = '/logout'

# Security views
app.config["SECURITY_LOGIN_USER_TEMPLATE"] = "login.html"
app.config["SECURITY_REGISTER_USER_TEMPLATE"] = "signup.html"

# Post security views
app.config['SECURITY_POST_LOGIN_VIEW'] = '/home'
app.config['SECURITY_POST_LOGOUT_VIEW'] = '/'
app.config['SECURITY_POST_REGISTER_VIEW'] = '/new-league'
app.config['SECURITY_UNAUTHORIZED_VIEW'] = '/'

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Define models
roles_users = db.Table(
    'roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)


class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))
    users = db.relationship('User', secondary=roles_users, back_populates='roles')


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    active = db.Column(db.Boolean(), nullable=False)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
    roles = db.relationship('Role', secondary=roles_users, back_populates='users')


# Setup Flask-Security
user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security(app, user_datastore)

# Create database tables
with app.app_context():
    db.create_all()


@app.route('/')
def landingPage():
    return render_template('index.html')


@app.route('/register')
def register_redirect():
    return redirect(url_for('security.register'))

AVAILABLE_LEAGUES = [
    {"id": "39", "name": "Premier League", "country": "England", "players_pool": "20 Clubs • All Premier League Squads"},
    {"id": "140", "name": "La Liga", "country": "Spain", "players_pool": "20 Clubs • All La Liga Squads"},
    {"id": "135", "name": "Serie A", "country": "Italy", "players_pool": "20 Clubs • All Serie A Squads"},
    {"id": "78", "name": "Bundesliga", "country": "Germany", "players_pool": "18 Clubs • All Bundesliga Squads"},
    {"id": "61", "name": "Ligue 1", "country": "France", "players_pool": "18 Clubs • All Ligue 1 Squads"},
    {"id": "2", "name": "UEFA Champions League", "country": "Europe", "players_pool": "36 Clubs • European Elite Squads"},
    {"id": "253", "name": "Major League Soccer (MLS)", "country": "USA / Canada", "players_pool": "29 Clubs • Eastern & Western Conferences"},
    {"id": "262", "name": "Liga MX", "country": "Mexico", "players_pool": "18 Clubs • All Liga MX Squads"},
    {"id": "88", "name": "Eredivisie", "country": "Netherlands", "players_pool": "18 Clubs • All Eredivisie Squads"},
    {"id": "94", "name": "Primeira Liga", "country": "Portugal", "players_pool": "18 Clubs • All Primeira Liga Squads"},
]


@app.route('/new-league', methods=['GET', 'POST'])
@auth_required()
def new_league():
    league_lookup = {league["id"]: league for league in AVAILABLE_LEAGUES}
    existing_config = session.get("league_config", {})
    bot_count = existing_config.get("bot_count", 7)
    selected_league_ids = [str(l["id"]) for l in existing_config.get("leagues", [])] or ["39"]

    if request.method == 'POST':
        raw_bot_count = (request.form.get('bot_count') or '').strip()
        submitted_leagues = request.form.getlist('leagues')
        dropdown_fallback = (request.form.get('league_dropdown') or '').strip()
        if not submitted_leagues and dropdown_fallback:
            submitted_leagues = [dropdown_fallback]

        # Deduplicate while preserving order and filtering to valid league IDs
        valid_selected_ids = []
        for lid in submitted_leagues:
            if lid in league_lookup and lid not in valid_selected_ids:
                valid_selected_ids.append(lid)

        errors = []
        try:
            bot_count_val = int(raw_bot_count)
            if not (1 <= bot_count_val <= 15):
                errors.append("Number of bots must be between 1 and 15.")
            else:
                bot_count = bot_count_val
        except ValueError:
            errors.append("Please enter a valid number of bots between 1 and 15.")

        if not valid_selected_ids:
            errors.append("Please select at least one league from the dropdown list.")
        else:
            selected_league_ids = valid_selected_ids

        if errors:
            for err in errors:
                flash(err, 'error')
            return render_template(
                'newLeague.html',
                available_leagues=AVAILABLE_LEAGUES,
                bot_count=bot_count,
                selected_league_ids=selected_league_ids
            )

        selected_leagues = [league_lookup[lid] for lid in valid_selected_ids]
        session['league_config'] = {
            'bot_count': bot_count,
            'leagues': selected_leagues
        }
        league_names = ", ".join(f"{l['name']} ({l['country']})" for l in selected_leagues)
        bot_label = "bot" if bot_count == 1 else "bots"
        flash(
            f"League created with {bot_count} {bot_label} ({bot_count + 1} total teams) and active player pools from: {league_names}.",
            'info'
        )
        return redirect(url_for('index'))

    return render_template(
        'newLeague.html',
        available_leagues=AVAILABLE_LEAGUES,
        bot_count=bot_count,
        selected_league_ids=selected_league_ids
    )


@app.route('/api/players/search')
@auth_required()
def api_player_search():
    search_query = (request.args.get('q') or '').strip()
    if not search_query:
        return jsonify({"error": "Please enter a player name to search.", "players": []}), 400
    try:
        players = playerRequest(search_query)
        return jsonify({"query": search_query, "players": players, "count": len(players)})
    except ValueError as err:
        return jsonify({"error": str(err), "players": []}), 400
    except requests.RequestException:
        return jsonify({"error": "Unable to reach the API-Football service right now.", "players": []}), 502

@app.route('/home', methods=['GET', 'POST'])
@auth_required()
def index():
    search_query = (request.values.get('q') or request.values.get('player_name') or '').strip()
    players = []
    search_error = None

    if search_query:
        try:
            players = playerRequest(search_query)
        except ValueError as err:
            search_error = str(err)
        except requests.RequestException:
            search_error = "Unable to reach the player database right now. Please try again."

    return render_template(
        'home.html',
        players=players,
        search_query=search_query,
        search_error=search_error
    )

# API JSON cache
CACHE_FILE = "api_cache.json"

def cache_load() -> dict:
    if not os.path.exists(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}

def cache_save(cache_data: dict) -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)

def get_cached(key: str):
    cache = cache_load()
    return cache.get(key)

def set_cached(key: str, data) -> None:
    cache = cache_load()
    cache[key] = data
    cache_save(cache)

# API calling functions
def playerRequest(playerName: str) -> list[dict]:
    cleanName = playerName.strip()
    if len(cleanName) < 3:
        raise ValueError("API-Football requires at least 3 characters to search.")

    parts = cleanName.split()
    api_search_term = parts[-1]
    cache_key = f"player_profiles:{api_search_term.lower()}"

    # Check the permanent cache first
    results = get_cached(cache_key)
    if results is None:
        response = requests.get(
            f"{BASE_URL}/players/profiles",
            headers=HEADERS,
            params={"search": api_search_term},
            timeout=10
        )
        response.raise_for_status()

        results = []
        for entry in response.json().get("response", []):
            p = entry.get("player", {})
            results.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "firstname": p.get("firstname"),
                "lastname": p.get("lastname"),
                "nationality": p.get("nationality"),
                "age": p.get("age"),
                "position": p.get("position"),
                "photo": p.get("photo"),
            })
        set_cached(cache_key, results)
    if len(parts) > 1:
        first_name = parts[0].lower()
        narrowed = [
            p for p in results
            if first_name in (p.get("firstname") or "").lower()
               or first_name in (p.get("name") or "").lower()
        ]
        if narrowed:
            return narrowed

    return results

def playerRequestByID(id: str):
    clean_id = str(id).strip()
    if not clean_id or not clean_id.isdigit():
        raise ValueError("A valid numeric player ID is required.")

    target_id = int(clean_id)
    cache_key = f"id:{target_id}"

    # 1. Check direct ID cache entry first
    cached_player = get_cached(cache_key)
    if cached_player is not None:
        return cached_player

    # 2. Check existing player_profiles search cache to avoid unnecessary API calls
    cache = cache_load()
    for key, value in cache.items():
        if key.startswith("player_profiles:") and isinstance(value, list):
            for player in value:
                if isinstance(player, dict) and player.get("id") == target_id:
                    set_cached(cache_key, player)
                    return player

    # 3. Query API-Football /players/profiles by player ID
    response = requests.get(
        f"{BASE_URL}/players/profiles",
        headers=HEADERS,
        params={"player": target_id},
        timeout=10
    )
    response.raise_for_status()

    entries = response.json().get("response", [])
    if not entries:
        return {}

    p = entries[0].get("player", {})
    player_info = {
        "id": p.get("id"),
        "name": p.get("name"),
        "firstname": p.get("firstname"),
        "lastname": p.get("lastname"),
        "nationality": p.get("nationality"),
        "age": p.get("age"),
        "position": p.get("position"),
        "photo": p.get("photo"),
    }
    set_cached(cache_key, player_info)
    return player_info


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    app.run(debug=debug_mode)
