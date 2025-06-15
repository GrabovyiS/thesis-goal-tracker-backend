const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const goalsRouter = require("./routes/goalsRouter");
const questsRouter = require("./routes/questsRouter");
const tasksRouter = require("./routes/tasksRouter");
const rewardsRouter = require("./routes/rewardsRouter");
const logsRouter = require("./routes/logsRouter");
const activeTaskRouter = require("./routes/activeTasksRouter");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const prisma = new PrismaClient();

async function enableForeignKeys() {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON;`);
    console.log("SQLite foreign keys enabled.");
  } catch (e) {
    console.error("Failed to enable foreign keys:", e);
  }
}

const app = express();

(async () => {
  await enableForeignKeys(); // Enable foreign keys before the server starts
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(
    session({
      secret: "your_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // true если используешь https
        maxAge: 24 * 60 * 60 * 1000, // 1 день
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
      exposedHeaders: ["Content-Disposition"],
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id); // сохраняем только ID
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID:
          "305172996906-n91bolg13t6fkvg8punj9jdhd0vrfqoo.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        const existing = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (existing) {
          return done(null, existing);
        }

        const user = await prisma.user.create({
          data: {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos?.[0]?.value,
          },
        });

        return done(null, user);
      }
    )
  );

  // Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/",
    }),
    (req, res) => {
      res.redirect("http://localhost:5173/dashboard");
    }
  );

  app.get("/me", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    res.json(req.user);
  });

  app.put("/me/subscribe", async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });

    const userId = req.user.id;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "SUBSCRIBER" || user.role === "ADMIN") {
        return res
          .status(400)
          .json({ message: "User is already subscribed or is an admin" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: "SUBSCRIBER" },
      });

      // Also update req.user in session
      req.login(updatedUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Session update failed" });
        }
        res.json({ message: "Subscription successful", user: updatedUser });
      });
    } catch (error) {
      console.error("Error upgrading user role:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await prisma.user.findMany();
      console.log(users);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.use("/api/goals", goalsRouter);
  app.use("/api/quests", questsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/rewards", rewardsRouter);
  app.use("/api/logs", logsRouter);
  app.use("/api/active-tasks", activeTaskRouter);

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
})();
