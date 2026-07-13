import { v2 as cloudinary } from "cloudinary";

// Configure lazily (called explicitly, not at import time) so this always
// runs AFTER dotenv.config() has loaded environment variables — avoids
// an ES module import-order race condition.
export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default cloudinary;