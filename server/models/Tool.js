const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    cat: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 140,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tool', toolSchema);
