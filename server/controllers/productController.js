// server/controllers/productController.js
const path     = require('path');
const fs       = require('fs');
const { sequelize } = require('../models');
const { QueryTypes }  = require('sequelize');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function padId(id) {
  return String(id).padStart(3, '0');
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await sequelize.query(
      `SELECT category_id, name, description FROM CATEGORY ORDER BY category_id ASC`,
      { type: QueryTypes.SELECT }
    );
    return res.status(200).json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ message: 'Failed to fetch categories.' });
  }
};

// POST /api/products/categories
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    // Check duplicate
    const [dup] = await sequelize.query(
      `SELECT category_id FROM CATEGORY WHERE LOWER(name) = LOWER(:name)`,
      { replacements: { name: name.trim() }, type: QueryTypes.SELECT }
    );
    if (dup) {
      return res.status(409).json({ message: 'A category with this name already exists.' });
    }

    await sequelize.query(
      `INSERT INTO CATEGORY (name, description) VALUES (:name, :description)`,
      { replacements: { name: name.trim(), description: description?.trim() || null }, type: QueryTypes.INSERT }
    );

    const [newCat] = await sequelize.query(
      `SELECT category_id, name, description FROM CATEGORY WHERE LOWER(name) = LOWER(:name) ORDER BY category_id DESC LIMIT 1`,
      { replacements: { name: name.trim() }, type: QueryTypes.SELECT }
    );

    return res.status(201).json({ message: 'Category added successfully.', category: newCat });
  } catch (err) {
    console.error('Add category error:', err);
    return res.status(500).json({ message: 'Failed to add category.' });
  }
};

// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

// GET /api/products  (+ summary counts)
const getProducts = async (req, res) => {
  try {
    const products = await sequelize.query(
      `SELECT
         p.product_id,
         p.name,
         p.description,
         p.price,
         p.image_url,
         p.is_available,
         p.category_id,
         c.name AS category_name
       FROM PRODUCT p
       LEFT JOIN CATEGORY c ON c.category_id = p.category_id
       ORDER BY p.product_id ASC`,
      { type: QueryTypes.SELECT }
    );

    const total     = products.length;
    const available = products.filter(p => p.is_available === 1 || p.is_available === true).length;
    const notAvail  = total - available;

    // "Needs restock" = linked inventory quantity <= low_stock_threshold
    const [{ needsRestock }] = await sequelize.query(
      `SELECT COUNT(*) AS needsRestock
       FROM INVENTORY
       WHERE quantity <= low_stock_threshold`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({ products, total, available, notAvailable: notAvail, needsRestock: Number(needsRestock) });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

// POST /api/products   (multipart/form-data)
const addProduct = async (req, res) => {
  try {
    const { name, category_id, description, price, is_available } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    if (is_available === undefined || is_available === null || is_available === '') {
      return res.status(400).json({ message: 'Status is required.' });
    }

    // Verify category exists
    const [cat] = await sequelize.query(
      `SELECT category_id FROM CATEGORY WHERE category_id = :category_id`,
      { replacements: { category_id }, type: QueryTypes.SELECT }
    );
    if (!cat) {
      return res.status(404).json({ message: 'Selected category does not exist.' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    await sequelize.query(
      `INSERT INTO PRODUCT (name, description, price, image_url, is_available, category_id)
       VALUES (:name, :description, :price, :image_url, :is_available, :category_id)`,
      {
        replacements: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parsedPrice,
          image_url,
          is_available: parseInt(is_available) === 1 ? 1 : 0,
          category_id: parseInt(category_id),
        },
        type: QueryTypes.INSERT,
      }
    );

    const [newProduct] = await sequelize.query(
      `SELECT p.product_id, p.name, p.description, p.price, p.image_url, p.is_available,
              p.category_id, c.name AS category_name
       FROM PRODUCT p LEFT JOIN CATEGORY c ON c.category_id = p.category_id
       ORDER BY p.product_id DESC LIMIT 1`,
      { type: QueryTypes.SELECT }
    );

    // ── AUTO-CREATE INVENTORY RECORD with default 0 values ──
    if (newProduct) {
      const now = new Date();
      await sequelize.query(
        `INSERT INTO INVENTORY (quantity, low_stock_threshold, last_updated, product_id, createdAt, updatedAt)
         VALUES (:quantity, :low_stock_threshold, :now, :product_id, :now, :now)`,
        {
          replacements: {
            quantity: 0,
            low_stock_threshold: 0,
            now,
            product_id: newProduct.product_id,
          },
          type: QueryTypes.INSERT,
        }
      );
    }

    return res.status(201).json({ message: 'Product added successfully.', product: newProduct });
  } catch (err) {
    console.error('Add product error:', err);
    return res.status(500).json({ message: 'Failed to add product.' });
  }
};

// PUT /api/products/:id   (multipart/form-data)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, description, price, is_available } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ message: 'Category is required.' });
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number.' });
    }
    if (is_available === undefined || is_available === null || is_available === '') {
      return res.status(400).json({ message: 'Status is required.' });
    }

    // Verify category exists
    const [cat] = await sequelize.query(
      `SELECT category_id FROM CATEGORY WHERE category_id = :category_id`,
      { replacements: { category_id }, type: QueryTypes.SELECT }
    );
    if (!cat) {
      return res.status(404).json({ message: 'Selected category does not exist.' });
    }

    // Fetch old image path so we can delete it if replaced
    const [existing] = await sequelize.query(
      `SELECT image_url FROM PRODUCT WHERE product_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    let image_url = existing.image_url;

    if (req.file) {
      // Delete old file from disk (best-effort)
      if (existing.image_url) {
        const oldPath = path.join(__dirname, '..', 'public', existing.image_url);
        fs.unlink(oldPath, () => {});
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    await sequelize.query(
      `UPDATE PRODUCT
       SET name = :name, description = :description, price = :price,
           image_url = :image_url, is_available = :is_available, category_id = :category_id
       WHERE product_id = :id`,
      {
        replacements: {
          name: name.trim(),
          description: description?.trim() || null,
          price: parsedPrice,
          image_url,
          is_available: parseInt(is_available) === 1 ? 1 : 0,
          category_id: parseInt(category_id),
          id,
        },
        type: QueryTypes.UPDATE,
      }
    );

    const [updated] = await sequelize.query(
      `SELECT p.product_id, p.name, p.description, p.price, p.image_url, p.is_available,
              p.category_id, c.name AS category_name
       FROM PRODUCT p LEFT JOIN CATEGORY c ON c.category_id = p.category_id
       WHERE p.product_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({ message: 'Product updated successfully.', product: updated });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ message: 'Failed to update product.' });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch existing image to clean up
    const [existing] = await sequelize.query(
      `SELECT image_url FROM PRODUCT WHERE product_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!existing) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    await sequelize.query(
      `DELETE FROM PRODUCT WHERE product_id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    // Delete image file (best-effort)
    if (existing.image_url) {
      const imgPath = path.join(__dirname, '..', 'public', existing.image_url);
      fs.unlink(imgPath, () => {});
    }

    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ message: 'Failed to delete product.' });
  }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory };