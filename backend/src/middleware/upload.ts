import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
const imagesDir = path.join(uploadsDir, "images");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to process and save images
export const processImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next();
  }

  try {
    const imagePromises = req.files.map(async (file: Express.Multer.File) => {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const filepath = path.join(imagesDir, filename);

      // Process image with sharp - resize and convert to webp
      await sharp(file.buffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(filepath);

      return `/uploads/images/${filename}`;
    });

    const imagePaths = await Promise.all(imagePromises);
    req.body.images = imagePaths;

    next();
  } catch (error) {
    console.error("Error processing images:", error);
    res.status(500).json({ error: "Error processing images" });
  }
};

// Export upload middleware for multiple files
export const uploadMultiple = upload.array("images", 5); // Allow up to 5 images

// Export upload middleware for single file
export const uploadSingle = upload.single("image");

export default upload;
