const moongoose = require('mongoose');

const launchesSchema = new moongoose.Schema({
  flightNumber: {
    type: Number,
    required: true,    
  },
  launchDate: {
    type: Date,
    required: true,
  },
  mission: {
    type: String,
    required: true,
  },
  rocket: {
    type: String,
    required: true,
  },
  target: {
    type: String,
  },
  customers: [String],
  upcoming: {
    type: Boolean,
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
    default: true,
  }

});

//Compile the model
//Connects launchesSchema with "launches" collection
module.exports = moongoose.model('Launch', launchesSchema);