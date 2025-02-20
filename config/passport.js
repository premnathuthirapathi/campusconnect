const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs'); // ✅ Secure password hashing
const User = require('../models/User'); // Ensure correct path

// ✅ Local Strategy for Login
passport.use(new LocalStrategy(
  { usernameField: 'email' }, 
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        console.log("❌ User not found:", email);
        return done(null, false, { message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("❌ Incorrect password for:", email);
        return done(null, false, { message: 'Incorrect password' });
      }

      console.log("✅ Login successful:", email);
      return done(null, user);
    } catch (err) {
      console.error("❌ Authentication error:", err);
      return done(err);
    }
  }
));

// ✅ Serialize User
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize User
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("❌ Error deserializing user:", err);
    done(err);
  }
});

module.exports = passport;
