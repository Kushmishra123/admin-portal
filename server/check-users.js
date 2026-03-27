const mongoose = require('mongoose');

async function listUsers() {
  const uri = "mongodb://kushmishra2002_db_user:040208@ac-fjlep1c-shard-00-00.hhotuxz.mongodb.net:27017,ac-fjlep1c-shard-00-01.hhotuxz.mongodb.net:27017,ac-fjlep1c-shard-00-02.hhotuxz.mongodb.net:27017/QB_Database?ssl=true&replicaSet=atlas-lbj3g5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=mainClusters";
  await mongoose.connect(uri);
  
  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', UserSchema);

  const users = await User.find({}, 'name employeeId profileImage');
  console.log("USERS IN DB:");
  users.forEach(u => {
    console.log(`Name: ${u.name}, ID: ${u.employeeId}, HasImage: ${!!u.profileImage}`);
  });

  process.exit(0);
}
listUsers();
