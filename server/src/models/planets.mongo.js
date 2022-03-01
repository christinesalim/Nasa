const mongoose = require('mongoose');

const planetSchema = new mongoose.Schema({
  keplerName: {
    type: String,
    required: true,
  },
});

//Compile the planet model
module.exports = mongoose.model('Planet', planetSchema);