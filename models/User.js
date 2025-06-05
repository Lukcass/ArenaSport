const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['jugador', 'admin'],
    default: 'jugador'
  },
  username: {
    type: String,
    sparse: true, 
    trim: true,
    unique: true
  },
  avatar: {
    url: { 
      type: String, 
      default: ''
    },
    public_id: { type: String, default: '' }
  },
  estado: { 
    type: String, 
    default: 'activo', 
    enum: ['activo', 'inactivo'] 
  }
}, {
  timestamps: true
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.comparePassword = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};
userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { sparse: true });
userSchema.index({ estado: 1 });
module.exports = mongoose.model('User', userSchema);