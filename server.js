const express = require( 'express' );
const mongoose = require( 'mongoose' );
const bcrypt = require( 'bcrypt' );
const session = require( 'express-session' );
const flash = require( 'express-flash' );

mongoose.connect('mongodb://localhost/users_db', {useNewUrlParser: true});

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
    const userName = request.body.userName;
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const password = request.body.password;

    bcrypt.hash( password, 10 )
        .then( encryptedPassword => {
            const newUser = {
                userName,
                firstName,
                lastName,
                password : encryptedPassword
            };
            console.log( newUser );
            UserModel
                .createUser( newUser )
                .then( result => {
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    request.session.userName = result.userName;
                    response.redirect( '/users' );
                })
                .catch( err => {
                    request.flash( 'registration', 'That username is already in use!' );
                    response.redirect( '/' );
                });
        });
});

app.post( '/users/login', function( request, response ){
    let userName = request.body.loginUserName;
    let password = request.body.loginPassword;

    UserModel
        .getUserById( userName )
        .then( result => {
            console.log( "Result", result );
            if( result === null ){
                throw new Error( "That user doesn't exist!" );
            }

            bcrypt.compare( password, result.password )
                .then( flag => {
                    if( !flag ){
                        throw new Error( "Wrong credentials!" );
                    }
                    request.session.firstName = result.firstName;
                    request.session.lastName = result.lastName;
                    request.session.userName = result.userName;

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

app.post( '/comments/addComment', function( request, response ){
    if( request.session.userName === undefined ){
        response.redirect( '/' );
    }
    else{
        let title = request.body.title;
        let content = request.body.content;
        let userName = request.session.userName;

        UserModel
            .getUserById( userName )
            .then( userResult => {
                let newComment = {
                    title,
                    content
                };
                UserModel
                    .updateUserComment( userResult._id, newComment )
                    .then( result => {
                        response.redirect( '/users' );
                    });
            });
    }
});

app.post( '/logout', function( request, response ){
    request.session.destroy();
    response.redirect( '/' ); 
});

app.get( '/users', function( request, response ){
    if( request.session.userName === undefined ){
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
                    userName : request.session.userName
                }
                response.render( 'index', { users : data, currentUser } );
            }); 
    }
  
});

app.get( '/users/getById', function( request, response ){
    let id = Number( request.query.id );

    UserModel
        .getUserById( id )
        .then( result => {
            if( result === null ){
                throw new Error( "That user doesn't exist" );
            }
            response.render( 'user', { found: true, user: result } );
        })
        .catch( error => {
            response.render( 'user', { found: false } );
        });
});

app.get( '/users/:identifier', function( request, response ){
    let id = Number( request.params.identifier );

    UserModel
        .getUserById( id )
        .then( result => {
            if( result === null ){
                throw new Error( "That user doesn't exist" );
            }
            response.render( 'user', { found: true, user: result } );
        })
        .catch( error => {
            response.render( 'user', { found: false } );
        });
});


app.listen( 8181, function(){
    console.log( "The users server is running in port 8181." );
});