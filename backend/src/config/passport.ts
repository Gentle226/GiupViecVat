import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../data/adapter";
import crypto from "crypto";

// Generate a random password for OAuth users
const generateRandomPassword = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const googleEmail = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const avatar = profile.photos?.[0]?.value || "";

        if (!googleEmail) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Check if user already exists with this email
        let user = await db.findUserByEmail(googleEmail);
        if (user) {
          // Update user with Google information if they don't have it
          if (!user.googleId) {
            user = await db.updateUser(user._id as string, {
              googleId,
              avatar: avatar || user.avatar,
            });
          }
          return done(null, user);
        }

        // Create new user with Google information
        const newUserData = {
          email: googleEmail,
          firstName,
          lastName,
          googleId,
          avatar,
          password: generateRandomPassword(), // Generate a random password
          isTasker: false, // Default to client, user can change later
          userType: "client" as const,
          location: {
            address: "Not specified",
            coordinates: [0, 0] as [number, number],
          },
          emailVerified: true, // Google accounts are pre-verified
        };

        const newUser = await db.createUser(newUserData);
        return done(null, newUser);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
