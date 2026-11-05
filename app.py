import os
from flask import Flask, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_security import Security, SQLAlchemyUserDatastore, auth_required, UserMixin, RoleMixin

app = Flask(__name__)

# Configurations
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'Wfye2-J8IUOziYCFCsVZrIMS_fQrR_AZN2mAN_QoLac')
app.config['SECURITY_USERNAME_ENABLE'] = True
app.config['SECURITY_USERNAME_REQUIRED'] = True
app.config['SECURITY_PASSWORD_SALT'] = os.environ.get('SECURITY_PASSWORD_SALT', '8386294171349055567303737871625959197')
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

@app.route('/new-league')
def new_league():
    return render_template('newLeague.html')

@app.route('/home')
@auth_required()
def index():
    return render_template('home.html')


if __name__ == '__main__':
    app.run(debug=True)
