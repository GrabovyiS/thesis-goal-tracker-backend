const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { PrismaClient } = require("@prisma/client");
const bodyParser = require("body-parser");
const goalsRouter = require("./routes/goalsRouter");
const questsRouter = require("./routes/questsRouter");
const tasksRouter = require("./routes/tasksRouter");
const activeTaskRouter = require("./routes/activeTasksRouter");
const cors = require("cors");

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
  app.use(
    session({
      secret: "your_secret_key",
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  );

  // Passport config remains the same
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((obj, done) => {
    done(null, obj);
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
        if (existing) return done(null, existing);
        const user = await prisma.user.create({
          data: {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
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

  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.use("/api/goals", goalsRouter);
  app.use("/api/quests", questsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/active-tasks", activeTaskRouter);

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
})();
