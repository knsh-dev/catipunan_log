// client/src/pages/ProductsPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/ProductsPage.css';

// ── Helpers ────────────────────────────────────────────────────
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatDate(d) {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatPrice(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toFixed(2);
}

function padProductId(id) {
  if (!id) return '—';
  return 'P' + String(id).padStart(3, '0');
}

const STATUS_OPTIONS = ['All', 'Available', 'Not Available'];

// ── Icons ──────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const AlertTriangle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const PackageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);

// ── Skeleton ───────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="pm-skeleton-row">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i}><div className="pm-skeleton-cell" style={{ width: i === 1 ? 44 : i === 4 ? '80%' : '60%' }} /></td>
    ))}
  </tr>
);

const Skeleton = ({ w = '100%', h = '16px', r = '6px' }) => (
  <div className="pm-skeleton" style={{ width: w, height: h, borderRadius: r }} />
);

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const isAvailable = status === 'Available';
  return (
    <span className={`pm-status-badge ${isAvailable ? 'pm-status-badge--available' : 'pm-status-badge--not'}`}>
      {status}
    </span>
  );
}

// ── Status Filter Dropdown ─────────────────────────────────────
function StatusFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="pm-filter" ref={ref}>
      <button className="pm-filter-btn" onClick={() => setOpen(v => !v)} type="button">
        <span>{value}</span>
        <ChevronDown />
      </button>
      {open && (
        <div className="pm-filter-dropdown">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`pm-filter-option${value === opt ? ' pm-filter-option--active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Image Upload Field ─────────────────────────────────────────
function ImageUploadField({ preview, onChange, label = 'Product Image', optional = true }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onChange(file);
  };

  return (
    <label className="pm-form-label">
      {label} {optional && <span className="pm-form-hint">(optional)</span>}
      <div
        className="pm-img-upload"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="pm-img-preview" />
        ) : (
          <div className="pm-img-placeholder">
            <UploadIcon />
            <span>Click to upload image</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
    </label>
  );
}

// ── Add Category Modal ─────────────────────────────────────────
function AddCategoryModal({ onClose, onAdded }) {
  const [form,    setForm]    = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/products/categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add category.');
      onAdded(json.category);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={e => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">Add New Category</h2>
          <button className="pm-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <form className="pm-modal-form" onSubmit={handleSubmit}>
          <label className="pm-form-label">
            Category Name <span className="pm-form-required">*</span>
            <input
              name="name"
              className="pm-form-input"
              placeholder="e.g. Hot Beverages"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="pm-form-label">
            Description <span className="pm-form-hint">(optional)</span>
            <textarea
              name="description"
              className="pm-form-input pm-form-textarea"
              placeholder="Brief description of this category…"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </label>

          {error && (
            <div className="pm-form-error">
              <AlertTriangle /> {error}
            </div>
          )}

          <div className="pm-modal-actions">
            <button type="button" className="pm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="pm-btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Product Modal ──────────────────────────────────────────
function AddProductModal({ categories, onClose, onAdded }) {
  const [form,    setForm]    = useState({
    name: '', category_id: '', description: '', price: '', status: 'Available',
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImage = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())     { setError('Product name is required.'); return; }
    if (!form.category_id)     { setError('Please select a category.'); return; }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      setError('Please enter a valid price.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fd    = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('category_id', form.category_id);
      fd.append('description', form.description.trim());
      fd.append('price',       parseFloat(form.price).toFixed(2));
      fd.append('is_available', form.status === 'Available' ? '1' : '0');
      if (imageFile) fd.append('image', imageFile);

      const res  = await fetch('/api/products', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add product.');
      onAdded(json.product);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal pm-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">Add New Product</h2>
          <button className="pm-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <form className="pm-modal-form" onSubmit={handleSubmit}>
          <div className="pm-form-row">
            <label className="pm-form-label">
              Product Name <span className="pm-form-required">*</span>
              <input
                name="name"
                className="pm-form-input"
                placeholder="e.g. Caramel Macchiato"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="pm-form-label">
              Category <span className="pm-form-required">*</span>
              <select
                name="category_id"
                className="pm-form-input pm-form-select"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">— Select Category —</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="pm-form-label">
            Description <span className="pm-form-hint">(optional)</span>
            <textarea
              name="description"
              className="pm-form-input pm-form-textarea"
              placeholder="Short product description…"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </label>

          <div className="pm-form-row">
            <label className="pm-form-label">
              Price (₱) <span className="pm-form-required">*</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="pm-form-input"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="pm-form-label">
              Status <span className="pm-form-required">*</span>
              <select
                name="status"
                className="pm-form-input pm-form-select"
                value={form.status}
                onChange={handleChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </label>
          </div>

          <ImageUploadField preview={imagePreview} onChange={handleImage} />

          {error && (
            <div className="pm-form-error">
              <AlertTriangle /> {error}
            </div>
          )}

          <div className="pm-modal-actions">
            <button type="button" className="pm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="pm-btn-primary" disabled={loading}>
              {loading ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Product Modal ─────────────────────────────────────────
function EditProductModal({ product, categories, onClose, onUpdated, onDeleted }) {
  const [form,    setForm]    = useState({
    name:        product.name        || '',
    category_id: product.category_id || '',
    description: product.description || '',
    price:       product.price       || '',
    status:      product.status      || 'Available',
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(
    product.image_url ? (product.image_url.startsWith('/uploads/') ? product.image_url : `/uploads/${product.image_url}`) : ''
  );
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImage = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())     { setError('Product name is required.'); return; }
    if (!form.category_id)     { setError('Please select a category.'); return; }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      setError('Please enter a valid price.'); return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const fd    = new FormData();
      fd.append('name',        form.name.trim());
      fd.append('category_id', form.category_id);
      fd.append('description', form.description.trim());
      fd.append('price',       parseFloat(form.price).toFixed(2));
      fd.append('is_available', form.status === 'Available' ? '1' : '0');
      if (imageFile) fd.append('image', imageFile);

      const res  = await fetch(`/api/products/${product.product_id}`, {
        method:  'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update product.');
      onUpdated(json.product);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`/api/products/${product.product_id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete product.');
      onDeleted(product.product_id);
      onClose();
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (showDelete) {
    return (
      <div className="pm-modal-overlay" onClick={onClose}>
        <div className="pm-modal pm-modal--delete" onClick={e => e.stopPropagation()}>
          <div className="pm-modal-header">
            <h2 className="pm-modal-title">Delete Product</h2>
            <button className="pm-modal-close" onClick={onClose} type="button"><XIcon /></button>
          </div>

          <div className="pm-delete-body">
            <div className="pm-delete-icon-wrap">
              <TrashIcon />
            </div>
            <p className="pm-delete-msg">
              Are you sure you want to delete <strong>{product.name}</strong>?
              This action cannot be undone.
            </p>
          </div>

          {deleteError && (
            <div className="pm-form-error">
              <AlertTriangle /> {deleteError}
            </div>
          )}

          <div className="pm-modal-actions">
            <button type="button" className="pm-btn-cancel" onClick={() => setShowDelete(false)}>Cancel</button>
            <button type="button" className="pm-btn-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal pm-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="pm-modal-header">
          <h2 className="pm-modal-title">Edit Product</h2>
          <button className="pm-modal-close" onClick={onClose} type="button"><XIcon /></button>
        </div>

        <form className="pm-modal-form" onSubmit={handleSubmit}>
          <div className="pm-form-row">
            <label className="pm-form-label">
              Product Name <span className="pm-form-required">*</span>
              <input
                name="name"
                className="pm-form-input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="pm-form-label">
              Category <span className="pm-form-required">*</span>
              <select
                name="category_id"
                className="pm-form-input pm-form-select"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">— Select Category —</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="pm-form-label">
            Description <span className="pm-form-hint">(optional)</span>
            <textarea
              name="description"
              className="pm-form-input pm-form-textarea"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </label>

          <div className="pm-form-row">
            <label className="pm-form-label">
              Price (₱) <span className="pm-form-required">*</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                className="pm-form-input"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="pm-form-label">
              Status <span className="pm-form-required">*</span>
              <select
                name="status"
                className="pm-form-input pm-form-select"
                value={form.status}
                onChange={handleChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </label>
          </div>

          <ImageUploadField
            preview={imagePreview}
            onChange={handleImage}
            label="Update Product Image"
          />

          {error && (
            <div className="pm-form-error">
              <AlertTriangle /> {error}
            </div>
          )}

          <div className="pm-modal-actions pm-modal-actions--edit">
            <button
              type="button"
              className="pm-btn-delete-outline"
              onClick={() => setShowDelete(true)}
            >
              <TrashIcon /> Delete
            </button>
            <div className="pm-modal-actions-right">
              <button type="button" className="pm-btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="pm-btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function ProductsPage({ user }) {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter] = useState('All');
  const [editTarget,  setEditTarget]  = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showAddCat,  setShowAddCat]  = useState(false);
  const [needsRestockCount, setNeedsRestockCount] = useState(0);
  const today = new Date();

  // Normalize backend is_available (0/1) → frontend status ('Available'/'Not Available')
  const normalizeProduct = useCallback((p) => ({
    ...p,
    status: (p.is_available === 1 || p.is_available === true) ? 'Available' : 'Not Available',
    need_restock: p.need_restock || false,
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products',            { headers }),
        fetch('/api/products/categories', { headers }),
      ]);
      if (!prodRes.ok) throw new Error('Failed to fetch products.');
      if (!catRes.ok)  throw new Error('Failed to fetch categories.');
      const [prodJson, catJson] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts((prodJson.products   || []).map(normalizeProduct));
      setCategories(catJson.categories || []);
      setNeedsRestockCount(prodJson.needsRestock ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [normalizeProduct]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Optimistic updates ──
  const handleAdded     = (p)  => setProducts(prev => [...prev, normalizeProduct(p)]);
  const handleUpdated   = (p)  => setProducts(prev => prev.map(x => x.product_id === p.product_id ? normalizeProduct(p) : x));
  const handleDeleted   = (id) => setProducts(prev => prev.filter(x => x.product_id !== id));
  const handleCatAdded  = (c)  => setCategories(prev => [...prev, c]);

  // ── Stats ──
  const totalProducts     = products.length;
  const availableProducts = products.filter(p => p.status === 'Available').length;
  const needRestock       = needsRestockCount; // from INVENTORY table via backend
  const notAvailable      = products.filter(p => p.status === 'Not Available').length;

  // ── Category name lookup ──
  const catMap = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.category_id] = c.name; });
    return map;
  }, [categories]);

  // ── Filtered products ──
  const filtered = useMemo(() => {
    let rows = products;
    if (statusFilter !== 'All') {
      rows = rows.filter(p => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(p =>
        [p.name, catMap[p.category_id], p.description]
          .some(f => (f || '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [products, statusFilter, search, catMap]);

  return (
    <div className="pm-page">

      {/* ── Greeting Bar ── */}
      <div className="pm-greeting">
        <span className="pm-greeting-text">
          Good Day! <strong>{user?.full_name?.split(' ')[0] || '...'}</strong>
        </span>
        <span className="pm-greeting-date">{formatDate(today)}</span>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="pm-error">
          <AlertTriangle /> {error}
          <button className="pm-error-retry" onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="pm-stats-grid">
        <div className="pm-stat-card">
          <span className="pm-stat-label">Total Products</span>
          <span className="pm-stat-value">
            {loading ? <Skeleton h="32px" w="60px" /> : totalProducts}
          </span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-label">Available Products</span>
          <span className="pm-stat-value">
            {loading ? <Skeleton h="32px" w="60px" /> : availableProducts}
          </span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-label">Need Restocks</span>
          <span className="pm-stat-value pm-stat-value--warn">
            {loading ? <Skeleton h="32px" w="60px" /> : needRestock}
          </span>
        </div>
        <div className="pm-stat-card">
          <span className="pm-stat-label">Not Available Products</span>
          <span className="pm-stat-value pm-stat-value--danger">
            {loading ? <Skeleton h="32px" w="60px" /> : notAvailable}
          </span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="pm-card">

        {/* Card Header */}
        <div className="pm-card-header">
          <span className="pm-card-title">Products</span>
          <div className="pm-card-controls">
            <span className="pm-filter-label">Status:</span>
            <StatusFilter value={statusFilter} onChange={setStatusFilter} />
            <button className="pm-btn-add-cat" onClick={() => setShowAddCat(true)} type="button">
              <PlusIcon /> Add Category
            </button>
            <button className="pm-btn-add-product" onClick={() => setShowAdd(true)} type="button">
              <PlusIcon /> Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>PRODUCT ID</th>
                <th>IMAGE</th>
                <th>NAME</th>
                <th>CATEGORY</th>
                <th>DESCRIPTION</th>
                <th>PRICE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="pm-empty">
                      <PackageIcon />
                      <span>
                        {search || statusFilter !== 'All'
                          ? 'No products match your filter.'
                          : 'No products found.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.product_id}>
                    <td className="pm-cell-id">{padProductId(p.product_id)}</td>
                    <td className="pm-cell-image">
                      {p.image_url ? (
                        <img
                          src={p.image_url.startsWith('/uploads/') ? p.image_url : `/uploads/${p.image_url}`}
                          alt={p.name}
                          className="pm-product-img"
                        />
                      ) : (
                        <div className="pm-product-img-placeholder">
                          <ImageIcon />
                        </div>
                      )}
                    </td>
                    <td className="pm-cell-name">{p.name}</td>
                    <td className="pm-cell-category">{catMap[p.category_id] || '—'}</td>
                    <td className="pm-cell-desc">{p.description || '—'}</td>
                    <td className="pm-cell-price">{formatPrice(p.price)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <button
                        className="pm-btn-edit"
                        onClick={() => setEditTarget(p)}
                        type="button"
                      >
                        EDIT
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="pm-card-footer">
            Showing <strong>{filtered.length}</strong> of <strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Add Category Modal ── */}
      {showAddCat && (
        <AddCategoryModal
          onClose={() => setShowAddCat(false)}
          onAdded={handleCatAdded}
        />
      )}

      {/* ── Add Product Modal ── */}
      {showAdd && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}

      {/* ── Edit Product Modal ── */}
      {editTarget && (
        <EditProductModal
          product={editTarget}
          categories={categories}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}