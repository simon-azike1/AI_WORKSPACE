const mongoose = require('mongoose');

const toolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    cat: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Tool', toolSchema);
