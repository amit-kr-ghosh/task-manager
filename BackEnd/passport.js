const passport = require("passport");
require("dotenv").config();

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LocalStrategy = require("passport-local").Strategy;

const authModel = require("./Models/Model");
const bcrypt = require("bcrypt");

// ----------------------------------------------------
// GOOGLE
// ----------------------------------------------------

const googleCredentials = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_DOMAIN}/google/callback`,
};

// ----------------------------------------------------
// FACEBOOK
// ----------------------------------------------------

const fbCredentials = {
  clientID: process.env.FACEBOOK_CLIENT_ID,
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_DOMAIN}/facebook/callback`,
  profileFields: ["id", "email", "displayName", "picture.type(large)"],
};

// ----------------------------------------------------
// GOOGLE CALLBACK
// ----------------------------------------------------

const googleCallback = async (accessToken, refreshToken, profile, cb) => {
  try {
    const email = profile.emails?.[0]?.value;
    const picture = profile.photos?.[0]?.value;

    if (!email) {
      return cb(new Error("Google account does not provide an email"));
    }

    const newUser = {
      userName: profile.displayName,
      email: email,
      googleId: profile.id,
      picUrl: picture,
    };

    const user = await authModel.findOne({
      googleId: profile.id,
    });

    if (user) {
      console.log("Google user found:", user.email);
      return cb(null, user);
    }

    const savedUser = await authModel(newUser).save();

    console.log("New Google user created:", savedUser.email);

    return cb(null, savedUser);
  } catch (err) {
    console.error("Google authentication error:", err);
    return cb(err);
  }
};

// ----------------------------------------------------
// FACEBOOK CALLBACK
// ----------------------------------------------------

const facebookCallback = async (accessToken, refreshToken, profile, cb) => {
  try {
    const email = profile.emails?.[0]?.value;
    const picture = profile.photos?.[0]?.value;

    if (!email) {
      return cb(new Error("Facebook account does not provide an email"));
    }

    const newUser = {
      userName: profile.displayName,
      fbId: profile.id,
      email: email,
      picUrl: picture,
    };

    const user = await authModel.findOne({
      fbId: profile.id,
    });

    if (user) {
      return cb(null, user);
    }

    const savedUser = await authModel(newUser).save();

    return cb(null, savedUser);
  } catch (err) {
    console.error("Facebook authentication error:", err);
    return cb(err);
  }
};

// ----------------------------------------------------
// LOCAL LOGIN
// ----------------------------------------------------

const localStrategyCallback = (email, password, done) => {
  authModel
    .findOne({ email })
    .then(async (user) => {
      if (!user) {
        return done(null, false);
      }

      // Google/Facebook users may not have a password
      if (!user.password) {
        return done(null, false);
      }

      const isValid = await bcrypt.compare(password, user.password);

      if (isValid) {
        return done(null, user);
      }

      return done(null, false, {
        message: "Incorrect password",
      });
    })
    .catch((err) => {
      return done(err);
    });
};

// ----------------------------------------------------
// PASSPORT STRATEGIES
// ----------------------------------------------------

passport.use(new GoogleStrategy(googleCredentials, googleCallback));

passport.use(new FacebookStrategy(fbCredentials, facebookCallback));

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    localStrategyCallback,
  ),
);

// ----------------------------------------------------
// SERIALIZATION
// ----------------------------------------------------

passport.serializeUser((user, done) => {
  console.log("SERIALIZE USER:", user.id);

  done(null, user.id);
});

// ----------------------------------------------------
// DESERIALIZATION
// ----------------------------------------------------

passport.deserializeUser((userId, done) => {
  console.log("DESERIALIZE USER ID:", userId);

  authModel
    .findById(userId)
    .then((user) => {
      console.log("DESERIALIZED USER:", user ? user.email : "USER NOT FOUND");

      done(null, user);
    })
    .catch((err) => {
      console.error("DESERIALIZE ERROR:", err);

      done(err);
    });
});

module.exports = passport;
