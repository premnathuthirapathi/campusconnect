const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passReqToCallback: true },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        // ✅ Compare Hashed Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }

        // ✅ Role Check (Optional Logging)
        console.log(`🔹 User Logged In: ${user.email} | Role: ${user.role}`);

        return done(null, user);
      } catch (err) {
        console.error('❌ Passport Auth Error:', err);
        return done(err);
      }
    }
  )
);

// ✅ Serialize user (store ID in session)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ Deserialize user (fetch user by ID)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (err) {
    console.error('❌ Deserialize Error:', err);
    return done(err);
  }
});

module.exports = passport;
