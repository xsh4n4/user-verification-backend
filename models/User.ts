import mongoose from 'mongoose';
const { Schema } = mongoose;
const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    imageurl: {
        type: String,
        required: false,
    },
    wallet: {
        type: String,
        required: false,
        unique: true,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        enum: [0, 1, 2, 3],
        // 0: Not started, 1: In progress, 2: Completed, 3: Failed
        default: 0
    }
});

export default mongoose.model('user', UserSchema);