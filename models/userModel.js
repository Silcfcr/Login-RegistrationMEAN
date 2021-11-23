const mongoose = require( 'mongoose' );
const {CommentSchema, CommentModel} = require( './commentModel' );
const UserSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 20
    },
    lastName : {
        type : String,
        required : true,
        minlength : 3,
        maxlength : 20
    },
    userName : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    },
    comments : [ CommentSchema ]
});

const User = mongoose.model( 'users', UserSchema );

const UserModel = {
    createUser : function( newUser ){
        return User.create( newUser );
    },
    getUsers : function(){
        return User.find();
    },
    getUserById : function( userName ){
        return User.findOne({ userName });
    },
    updateUserComment : function( id, newComment ){
        return CommentModel.addComment( newComment )
            .then( result => {
                return User.findByIdAndUpdate({_id: id}, {$push: {comments: result}});
            });
    }
};

module.exports = {UserModel};
