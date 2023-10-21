const bcrypt = require("bcryptjs");
const saltRounds = 10;

bcrypt.genSalt(saltRounds, function (err, salt) {
  bcrypt.hash(plainPassword, salt, function (err, hash) {
    console.log(hash);
  });
});
