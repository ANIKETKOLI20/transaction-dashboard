const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://aniketkoli1:bDfod303DB81uh7D@cluster0.zxiyjgv.mongodb.net/transactiondb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// Connection successful
db.once('connected', () => {
  console.log('Connected to MongoDB');
});

// Connection error
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
