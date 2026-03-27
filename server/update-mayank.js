const mongoose = require('mongoose');
const fs = require('fs');

async function seed() {
  const uri = "mongodb://kushmishra2002_db_user:040208@ac-fjlep1c-shard-00-00.hhotuxz.mongodb.net:27017,ac-fjlep1c-shard-00-01.hhotuxz.mongodb.net:27017,ac-fjlep1c-shard-00-02.hhotuxz.mongodb.net:27017/QB_Database?ssl=true&replicaSet=atlas-lbj3g5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=mainClusters";
  
  await mongoose.connect(uri);
  
  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.model('User', UserSchema);

  const imgPath = 'C:\\Users\\lenovo\\.gemini\\antigravity\\brain\\b1fe8dd0-0044-4497-b022-33858c438526\\mayank_profile_avatar_1774613928107.png';
  if (fs.existsSync(imgPath)) {
    const base64Image = fs.readFileSync(imgPath).toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;
    
    // Find Mayank or update all if Mayank
    await User.updateMany({ name: /Mayank/i }, { $set: { profileImage: dataUri } });
    console.log("Updated Mayank's profile image successfully in MongoDB!");
  } else {
    console.error("Generated image path not found");
  }

  process.exit(0);
}

seed();
