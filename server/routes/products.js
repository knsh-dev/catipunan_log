// server/routes/productRoutes.js
const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
} = require('../controllers/productController');

const router = express.Router();

// ── Multer setup ───────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const safeName = `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk  = allowed.test(file.mimetype.replace('image/', ''));
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp).'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Category Routes ────────────────────────────────────────────
// GET  /api/categories
// POST /api/categories
router.get(   '/categories',       protect, getCategories);
router.post(  '/categories',       protect, restrictTo('admin'), addCategory);

// ── Product Routes ─────────────────────────────────────────────
// GET    /api/products
// POST   /api/products
// PUT    /api/products/:id
// DELETE /api/products/:id
router.get(   '/',    protect, getProducts);
router.post(  '/',    protect, restrictTo('admin'), upload.single('image'), addProduct);
router.put(   '/:id', protect, restrictTo('admin'), upload.single('image'), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

// ── Multer error handler ───────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('image')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;