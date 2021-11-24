const express = require( 'express' );
const mongoose = require( 'mongoose' );
const bcrypt = require( 'bcrypt' );
const session = require( 'express-session' );
const flash = require( 'express-flash' );

mongoose.connect('mongodb://localhost/login_and_registration)', {useNewUrlParser: true});

const {UserModel} = require( './models/userModel' );
const app = express();

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

app.use( flash() );
app.use( express.urlencoded({extended:true}) );
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 * 20 }
}));

app.get( '/', function( request, response ){
    response.render( 'login' );
});

app.post( '/users/addUser', function( request, response ){
    const email = request.body.email;
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const password = request.body.password;
    const birthday = request.body.birthday;

    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    if (validateEmail(email) === false){
        request.flash( 'registration', 'The email is not valid!' );
        response.redirect( '/' );
    }

    bcrypt.hash( password, 10 )
        .then( encryptedPassword => {
            const newUser = {
                email,
                firstName,
                lastName,
                password : encryptedPassword,
                birthday,
            };
            console.log( newUser );
            UserModel
                .createUser( newUser )
                .then( result => {
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    response.redirect( '/users' );
                })
                .catch( err => {
                    request.flash( 'registration', 'That email is already in use!' );
                    response.redirect( '/' );
                });
        });
});

app.post( '/users/login', function( request, response ){
    let email = request.body.email;
    let password = request.body.loginPassword;

    UserModel
        .getUserByEmail( email )
        .then( result => {
            console.log( "Result of get user by email", result );
            if( result === null ){
                throw new Error( "That email doesn't exist!" );
            }

            bcrypt.compare( password, result.password )
                .then( flag => {
                    if( !flag ){
                        throw new Error( "Wrong credentials!" );
                    }
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    response.redirect( '/users' );
                })
                .catch( error => {
                    request.flash( 'login', error.message );
                    response.redirect( '/' );
                }); 
        })
        .catch( error => {
            request.flash( 'login', error.message );
            response.redirect( '/' );
        });
});


app.post( '/logout', function( request, response ){
    request.session.destroy();
    response.redirect( '/' ); 
});

app.get( '/users', function( request, response ){
    if( request.session.firstName === undefined ){
        response.redirect( '/' );
    }
    else{
        UserModel
            .getUsers()
            .then( data => {
                console.log( data );
                let currentUser = {
                    firstName : request.session.firstName, 
                    lastName : request.session.lastName,
                }
                response.render( 'index', { users : data, currentUser } );
            }); 
    }
});

app.listen( 8181, function(){
    console.log( "The users server is running in port 8181." );
});