require("dotenv").config();
require("./passport");

const express = require("express");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

const authModel = require("./Models/Model");

const TodoRoutes = require("./Routes/TodoRoutes");
const NoteRoutes = require("./Routes/NoteRoutes");
const TaskRoutes = require("./Routes/TaskRoutes");
const AIRoutes = require("./Routes/AIRoutes");

const app = express();

const PORT = process.env.PORT || 8080;

const isProduction = process.env.NODE_ENV === "production";

// ----------------------------------------------------
// TRUST PROXY
// ----------------------------------------------------

if (isProduction) {
  app.set("trust proxy", 1);
}

// ----------------------------------------------------
// CORS
// ----------------------------------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_DOMAIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ----------------------------------------------------
// BODY PARSING
// ----------------------------------------------------

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ----------------------------------------------------
// MONGODB SESSION STORE
// ----------------------------------------------------

const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  collectionName: "session",
});

// ----------------------------------------------------
// SESSION
// ----------------------------------------------------

app.use(
  session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: sessionStore,

    cookie: {
      maxAge: 1000 * 60 * 60 * 24,

      httpOnly: true,

      // LOCAL:
      // sameSite = lax
      // secure = false

      // PRODUCTION:
      // sameSite = none
      // secure = true

      sameSite: isProduction ? "none" : "lax",

      secure: isProduction,
    },
  }),
);

// ----------------------------------------------------
// PASSPORT
// ----------------------------------------------------

app.use(passport.initialize());

app.use(passport.session());

// ----------------------------------------------------
// HOME
// ----------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    message: "Task Manager Backend is running",
  });
});

// ----------------------------------------------------
// DEBUG SESSION
// ----------------------------------------------------

app.get("/debug-session", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
    session: req.session,
  });
});

// ----------------------------------------------------
// REGISTER
// ----------------------------------------------------

app.post("/register", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required",
      });
    }

    const existingUser = await authModel.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: "Already Registered",
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newAuth = new authModel({
      userName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newAuth.save();

    res.status(201).json(savedUser);
  } catch (err) {
    console.error("Registration error:", err);

    res.status(500).json({
      error: "Registration failed",
    });
  }
});

// ----------------------------------------------------
// GOOGLE
// ----------------------------------------------------

app.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

app.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_DOMAIN,

    successRedirect: `${process.env.FRONTEND_DOMAIN}/Home`,
  }),
);

// ----------------------------------------------------
// FACEBOOK
// ----------------------------------------------------

app.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  }),
);

app.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: process.env.FRONTEND_DOMAIN,

    successRedirect: `${process.env.FRONTEND_DOMAIN}/Home`,
  }),
);

// ----------------------------------------------------
// LOCAL LOGIN
// ----------------------------------------------------

app.post(
  "/login",

  passport.authenticate("local", {
    failureRedirect: process.env.FRONTEND_DOMAIN,
  }),

  (req, res) => {
    res.json({
      success: "successfully logged in",
      user: req.user,
    });
  },
);

// ----------------------------------------------------
// LOGOUT
// ----------------------------------------------------

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);

      return res.status(500).json({
        error: "Logout failed",
      });
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        console.error("Session destroy error:", sessionError);
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      });

      res.json({
        success: "logged out",
      });
    });
  });
});

// ----------------------------------------------------
// CURRENT USER
// ----------------------------------------------------

app.get("/getUser", (req, res) => {
  console.log("GET USER:", req.user ? req.user.email : "NOT AUTHENTICATED");

  if (!req.user) {
    return res.status(401).json({
      error: "Login Required",
    });
  }

  res.json(req.user);
});

// ----------------------------------------------------
// RESET PASSWORD
// ----------------------------------------------------

app.post("/resetPassword/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err) => {
      if (err) {
        return res.status(401).json({
          Status: "Try again after few minutes",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          Status: "New password is required",
        });
      }

      const salt = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await authModel.findByIdAndUpdate(id, {
        password: hashedPassword,
      });

      res.json({
        Status: "success",
      });
    });
  } catch (err) {
    console.error("Reset password error:", err);

    res.status(500).json({
      Status: "Password reset failed",
    });
  }
});

// ----------------------------------------------------
// FORGOT PASSWORD
// ----------------------------------------------------

app.post("/forgotpass", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await authModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        Status: "Enter a valid email",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1d",
      },
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,

      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const resetUrl =
      `${process.env.FRONTEND_DOMAIN}` + `/ResetPass/${user._id}/${token}`;

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: "Forgot password for task manager",
      text: resetUrl,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      Status: "success",
    });
  } catch (err) {
    console.error("Forgot password error:", err);

    res.status(500).json({
      Status: "Email could not be sent",
    });
  }
});

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------

const authenticator = (req, res, next) => {
  console.log("AUTH CHECK:", req.isAuthenticated());

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Login Required",
    });
  }

  next();
};

// ----------------------------------------------------
// PROTECTED ROUTES
// ----------------------------------------------------

app.use("/todo", authenticator, TodoRoutes);

app.use("/note", authenticator, NoteRoutes);

app.use("/task", authenticator, TaskRoutes);

// ----------------------------------------------------
// AI ROUTES
// ----------------------------------------------------

app.use("/ai", authenticator, AIRoutes);

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running On Port : ${PORT}`);
});

module.exports = app;
