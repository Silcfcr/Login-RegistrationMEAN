const mongoose = require( 'mongoose' );
const UserSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
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
    password : {
        type : String,
        required : true
    },
    birthday : {
        type: Date,
        required : true
    }
    
});

const User = mongoose.model( 'users', UserSchema );

const UserModel = {
    createUser : function( newUser ){
        return User.create( newUser );
    },
    getUsers : function(){
        return User.find();
    },
    getUserByEmail : function( email ){
        return User.findOne({ email });
    },
};

module.exports = {UserModel};
