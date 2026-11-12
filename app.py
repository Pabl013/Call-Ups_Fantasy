import os

from dotenv import load_dotenv

from flask import Flask, render_template, redirect, url_for, request, flash

from flask_sqlalchemy import SQLAlchemy

from flask_security import (
    Security,
    SQLAlchemyUserDatastore,
    auth_required,
    current_user,
    UserMixin,
    RoleMixin
)

from flask_wtf.csrf import CSRFProtect


# ==================================================
# LOAD ENVIRONMENT VARIABLES
# ==================================================

load_dotenv()

app = Flask(__name__)


# ==================================================
# CONFIGURATIONS
# ==================================================

if not os.environ.get('SECRET_KEY') or not os.environ.get('SECURITY_PASSWORD_SALT'):
    raise RuntimeError(
        "Missing SECRET_KEY or SECURITY_PASSWORD_SALT environment variables. "
        "Copy .env.example to .env and set valid values."
    )

app.config['SECRET_KEY'] = os.environ['SECRET_KEY']

app.config['SECURITY_USERNAME_ENABLE'] = True
app.config['SECURITY_USERNAME_REQUIRED'] = True

app.config['SECURITY_PASSWORD_SALT'] = os.environ['SECURITY_PASSWORD_SALT']
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'

app.config['SECURITY_RECOVERABLE'] = False

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'sqlite:///app.db'
)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


# ==================================================
# FLASK SECURITY CONFIGURATION
# ==================================================

app.config['SECURITY_REGISTERABLE'] = True

app.config['SECURITY_SEND_REGISTER_EMAIL'] = False

app.config['SECURITY_EMAIL_VALIDATOR_ARGS'] = {
    'check_deliverability': False
}


# Security URLs

app.config['SECURITY_LOGIN_URL'] = '/login'
app.config['SECURITY_REGISTER_URL'] = '/signup'
app.config['SECURITY_LOGOUT_URL'] = '/logout'


# Security templates

app.config['SECURITY_LOGIN_USER_TEMPLATE'] = 'login.html'
app.config['SECURITY_REGISTER_USER_TEMPLATE'] = 'signup.html'


# Redirects

app.config['SECURITY_POST_LOGIN_VIEW'] = '/home'

app.config['SECURITY_POST_LOGOUT_VIEW'] = '/'

app.config['SECURITY_POST_REGISTER_VIEW'] = '/new-league'

app.config['SECURITY_UNAUTHORIZED_VIEW'] = '/'


# ==================================================
# DATABASE INITIALIZATION
# ==================================================

db = SQLAlchemy(app)


# ==================================================
# DATABASE MODELS
# ==================================================

roles_users = db.Table(
    'roles_users',

    db.Column(
        'user_id',
        db.Integer(),
        db.ForeignKey('user.id')
    ),

    db.Column(
        'role_id',
        db.Integer(),
        db.ForeignKey('role.id')
    )
)


# ==================================================
# ROLE MODEL
# ==================================================

class Role(db.Model, RoleMixin):

    id = db.Column(
        db.Integer(),
        primary_key=True
    )

    name = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    description = db.Column(
        db.String(255)
    )

    users = db.relationship(
        'User',
        secondary=roles_users,
        back_populates='roles'
    )


# ==================================================
# USER MODEL
# ==================================================

class User(db.Model, UserMixin):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    username = db.Column(
        db.String(255),
        unique=True,
        nullable=False
    )

    password = db.Column(
        db.String(255),
        nullable=True
    )

    active = db.Column(
        db.Boolean(),
        nullable=False
    )

    fs_uniquifier = db.Column(
        db.String(64),
        unique=True,
        nullable=False
    )

    roles = db.relationship(
        'Role',
        secondary=roles_users,
        back_populates='users'
    )

    # Relationship between User and League

    leagues = db.relationship(
        'League',
        back_populates='creator'
    )


# ==================================================
# LEAGUE MODEL
# ==================================================

class League(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    number_of_bots = db.Column(
        db.Integer,
        default=0,
        nullable=False
    )

    football_leagues = db.Column(
        db.JSON,
        nullable=False
    )

    creator_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=False
    )

    creator = db.relationship(
        'User',
        back_populates='leagues'
    )


# ==================================================
# FLASK SECURITY INITIALIZATION
# ==================================================

user_datastore = SQLAlchemyUserDatastore(
    db,
    User,
    Role
)

security = Security(
    app,
    user_datastore
)


# ==================================================
# CSRF PROTECTION
# ==================================================

csrf = CSRFProtect(app)


# ==================================================
# CREATE DATABASE TABLES
# ==================================================

with app.app_context():

    db.create_all()


# ==================================================
# LANDING PAGE
# ==================================================

@app.route('/')
def landingPage():

    return render_template('index.html')


# ==================================================
# REGISTER REDIRECT
# ==================================================

@app.route('/register')
def register_redirect():

    return redirect(
        url_for('security.register')
    )


# ==================================================
# CREATE NEW LEAGUE
# ==================================================

@app.route('/new-league', methods=['GET', 'POST'])
@auth_required()
def new_league():

    if request.method == 'POST':

        # Get league name

        league_name = request.form.get(
            'leagueName',
            ''
        ).strip()

        # Get number of bots

        bots_value = request.form.get(
            'bots',
            '0'
        )

        # Get selected football leagues

        football_leagues = request.form.getlist(
            'footballLeagues'
        )


        # ==================================================
        # VALIDATE LEAGUE NAME
        # ==================================================

        if not league_name:

            flash(
                'Please enter a league name.',
                'error'
            )

            return redirect(
                url_for('new_league')
            )

        if len(league_name) > 100:

            flash(
                'League name must contain at most 100 characters.',
                'error'
            )

            return redirect(
                url_for('new_league')
            )


        # ==================================================
        # VALIDATE NUMBER OF BOTS
        # ==================================================

        if bots_value not in ('0', '2', '4', '6'):

            flash(
                'Invalid number of bots.',
                'error'
            )

            return redirect(
                url_for('new_league')
            )

        number_of_bots = int(bots_value)


        # ==================================================
        # VALIDATE FOOTBALL LEAGUES
        # ==================================================

        allowed_leagues = {
            'Premier League',
            'La Liga',
            'Serie A',
            'Bundesliga',
            'Ligue 1'
        }

        if (
            not football_leagues
            or any(
                league not in allowed_leagues
                for league in football_leagues
            )
            or len(football_leagues) != len(set(football_leagues))
        ):

            flash(
                'Please select valid football leagues.',
                'error'
            )

            return redirect(
                url_for('new_league')
            )


        # ==================================================
        # CREATE NEW LEAGUE
        # ==================================================

        new_fantasy_league = League(

            name=league_name,

            number_of_bots=number_of_bots,

            football_leagues=football_leagues,

            creator_id=current_user.id

        )


        # ==================================================
        # SAVE LEAGUE TO DATABASE
        # ==================================================

        try:

            db.session.add(
                new_fantasy_league
            )

            db.session.commit()

        except Exception:

            db.session.rollback()

            app.logger.exception(
                'Failed to create fantasy league'
            )

            flash(
                'Unable to create the league. Please try again.',
                'error'
            )

            return redirect(
                url_for('new_league')
            )


        # ==================================================
        # SUCCESS MESSAGE
        # ==================================================

        print(
            'League created:',
            new_fantasy_league.name
        )

        print(
            'Number of bots:',
            new_fantasy_league.number_of_bots
        )

        print(
            'Football leagues:',
            new_fantasy_league.football_leagues
        )

        flash(
            'Your fantasy league was created successfully!',
            'success'
        )

        return redirect(
            url_for('index')
        )


    # GET request

    return render_template(
        'newLeague.html'
    )


# ==================================================
# HOME / DASHBOARD
# ==================================================

@app.route('/home')
@auth_required()
def index():

    return render_template(
        'home.html'
    )


# ==================================================
# RUN APPLICATION
# ==================================================

if __name__ == '__main__':
    app.run(debug=True)
