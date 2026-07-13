import multer from "multer";

// Keep the uploaded file in memory (as a buffer) instead of writing to local disk.
// This is required because Render's disk is temporary — files would vanish on redeploy.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;