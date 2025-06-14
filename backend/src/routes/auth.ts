import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import passport from "../config/passport";
import { db } from "../data/adapter";
import { authenticateToken } from "../middleware/auth";
import ResponseHelper from "../utils/ResponseHelper";
import { generateRandomPassword } from "../utils/auth";

const router = Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return jwt.sign({ userId: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  } as jwt.SignOptions);
};

// Transform user data to match frontend expected structure
const transformUser = (user: any) => {
  // Handle both memory store (backend User) and MongoDB (IUser) formats
  const isMemoryStoreUser = "userType" in user;
  const isMongoUser = "isTasker" in user;

  return {
    _id: user._id,
    email: user.email,
    firstName: isMemoryStoreUser
      ? user.firstName || (user.name ? user.name.split(" ")[0] : "User")
      : user.firstName,
    lastName: isMemoryStoreUser
      ? user.lastName ||
        (user.name ? user.name.split(" ").slice(1).join(" ") : "")
      : user.lastName,
    avatar: user.avatar,
    isTasker: isMemoryStoreUser ? user.userType === "tasker" : user.isTasker,
    rating: user.rating || 0,
    reviewCount: user.reviewCount || 0,
    bio: user.bio,
    skills: user.skills || [],
    hourlyRate: user.hourlyRate,
    availability: user.availability,
    location:
      typeof user.location === "string"
        ? { address: user.location, coordinates: [0, 0] }
        : user.location || { address: "Not specified", coordinates: [0, 0] },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || user.createdAt,
  };
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, isTasker, location } =
      req.body; // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return ResponseHelper.error(res, req, "auth.userExists", 400);
    } // Create new user
    const userCreateData = {
      email,
      password,
      firstName,
      lastName,
      isTasker,
      userType: isTasker ? "tasker" : "client",
      location: location || {
        address: "Not specified",
        coordinates: [0, 0] as [number, number],
      },
    };
    const user = await db.createUser(userCreateData); // Generate token
    const token = generateToken(user._id as string); // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    return ResponseHelper.success(
      res,
      req,
      "auth.registrationSuccess",
      {
        user: transformedUser,
        token,
      },
      201
    );
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "auth.registrationFailed",
      500,
      error.message
    );
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      return ResponseHelper.error(res, req, "auth.invalidCredentials", 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ResponseHelper.error(res, req, "auth.invalidCredentials", 401);
    }

    // Generate token
    const token = generateToken(user._id as string);

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    return ResponseHelper.success(res, req, "auth.loginSuccess", {
      user: transformedUser,
      token,
    });
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

// Get current user profile
router.get("/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await db.findUserById(req.userId);
    if (!user) {
      return ResponseHelper.notFound(res, req, "auth.userNotFound");
    }

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    return ResponseHelper.success(
      res,
      req,
      "users.profileRetrieved",
      transformedUser
    );
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "users.profileRetrievalFailed",
      500,
      error.message
    );
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req: any, res) => {
  try {
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates._id;
    delete updates.email;
    const user = await db.updateUser(req.userId, updates);
    if (!user) {
      return ResponseHelper.notFound(res, req, "auth.userNotFound");
    }

    // Transform user to match frontend expected structure
    const transformedUser = transformUser(user);

    return ResponseHelper.success(
      res,
      req,
      "auth.profileUpdateSuccess",
      transformedUser
    );
  } catch (error: any) {
    return ResponseHelper.error(
      res,
      req,
      "auth.profileUpdateFailed",
      500,
      error.message
    );
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return ResponseHelper.error(res, req, "auth.passwordRequired", 400);
    }

    if (newPassword.length < 6) {
      return ResponseHelper.error(res, req, "validation.passwordTooShort", 400);
    }

    // Find the user
    const user = await db.findUserById(req.userId);
    if (!user) {
      return ResponseHelper.notFound(res, req, "auth.userNotFound");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return ResponseHelper.error(res, req, "auth.invalidCredentials", 400);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.updateUser(req.userId, { password: hashedNewPassword });

    return ResponseHelper.success(res, req, "auth.profileUpdateSuccess");
  } catch (error: any) {
    return ResponseHelper.serverError(res, req, error.message);
  }
});

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    // Successful authentication, generate a token and redirect.
    const token = generateToken((req.user as any)._id);
    const user = transformUser(req.user);
    res.redirect(
      `${
        process.env.FRONTEND_URL
      }/auth/callback?token=${token}&user=${JSON.stringify(user)}`
    );
  }
);

// Google OAuth token verification route
router.post("/google/verify", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return ResponseHelper.error(res, req, "auth.tokenMissing", 400);
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return ResponseHelper.error(res, req, "auth.invalidToken", 400);
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: avatar,
    } = payload;

    if (!email) {
      return ResponseHelper.error(res, req, "auth.emailRequired", 400);
    }

    // Check if user already exists
    let user = await db.findUserByEmail(email);
    if (user) {
      // Update user with Google ID if not already set
      if (!user.googleId) {
        user = await db.updateUser(user._id as string, {
          googleId,
          avatar: avatar || user.avatar,
          emailVerified: true,
        });
      }
    } else {
      // Create new user
      const newUserData = {
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        googleId,
        avatar: avatar || "",
        password: generateRandomPassword(),
        isTasker: false,
        userType: "client" as const,
        location: {
          address: "Not specified",
          coordinates: [0, 0] as [number, number],
        },
        emailVerified: true,
      };

      user = await db.createUser(newUserData);
    }

    // Generate JWT token
    const token = generateToken(user._id as string);

    // Transform user for response
    const transformedUser = transformUser(user);

    return ResponseHelper.success(res, req, "auth.loginSuccess", {
      user: transformedUser,
      token,
    });
  } catch (error: any) {
    console.error("Google OAuth verification error:", error);
    return ResponseHelper.error(
      res,
      req,
      "auth.googleAuthFailed",
      500,
      error.message
    );
  }
});

export default router;
