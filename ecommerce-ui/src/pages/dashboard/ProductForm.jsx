import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProduct, getCategories, addProduct, updateProduct, uploadProductImages, deleteProductImage, getImageUrl } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardTable.css'
import './DashboardForm.css'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [productId, setProductId] = useState(null)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    productName: '',
    categoryId: '',
    description: '',
    price: '',
    stockQuentity: 0,
  })

  useEffect(() => {
    loadCategories()
    if (isEdit) loadProduct()
    else setLoading(false)
  }, [id, isEdit])

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setCategories([])
    }
  }

  async function loadProduct() {
    setLoading(true)
    try {
      const p = await getProduct(id)
      setProductId(p?.id ?? Number(id))
      setImages(Array.isArray(p?.productImages) ? p.productImages : [])
      setForm({
        productName: p?.name ?? '',
        categoryId: p?.categoryId != null && p?.categoryId !== '' ? Number(p.categoryId) : '',
        description: p?.description ?? '',
        price: p?.price ?? '',
        stockQuentity: p?.stockQuantity ?? 0,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'categoryId' ? (value ? Number(value) : null) : name === 'stockQuentity' || name === 'price' ? (value === '' ? (name === 'price' ? '' : 0) : (name === 'price' ? value : Number(value))) : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = {
        productName: form.productName.trim(),
        categoryId: form.categoryId === '' || form.categoryId == null ? null : Number(form.categoryId),
        description: form.description.trim(),
        price: form.price === '' ? 0 : Number(form.price),
        stockQuentity: Number(form.stockQuentity) || 0,
      }
      if (isEdit) {
        await updateProduct({ ...payload, productId: Number(id) })
        setProductId(Number(id))
        setSuccess('Product updated successfully.')
      } else {
        const res = await addProduct(payload)
        const created = res?.data ?? res?.Data
        const createdId = created?.productId ?? created?.ProductId ?? res?.productId ?? res?.ProductId
        if (createdId) setProductId(Number(createdId))
        setSuccess('Product added successfully.')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e) {
    const files = e.target.files
    if (!files?.length || !productId || !form.productName?.trim()) {
      setError('Save the product first and set a product name, then choose images.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      await uploadProductImages({
        productId,
        productName: form.productName.trim(),
        brand: form.productName.trim(),
        files: Array.from(files),
        imageAltText: form.productName.trim(),
      })
      const updated = await getProduct(productId)
      setImages(Array.isArray(updated?.productImages) ? updated.productImages : [])
      e.target.value = ''
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteImage(img) {
    const imageId = img.imageId ?? img.ImageId
    if (!imageId) return
    try {
      await deleteProductImage(imageId)
      setImages((prev) => prev.filter((i) => (i.imageId ?? i.ImageId) !== imageId))
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <p className="dashboard-loading">Loading…</p>

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>
          <p className="dash-subtitle">{isEdit ? 'Update details, stock, and product images.' : 'Create a shoe listing, then add photos.'}</p>
        </div>
        <button type="button" className="dashboard-btn" onClick={() => navigate(`${ADMIN_DASHBOARD_PATH}/products`)}>
          Back to catalog
        </button>
      </div>
      <form onSubmit={handleSubmit} className="dashboard-form">
        {error && <p className="dashboard-error">{error}</p>}
        {success && <p className="dashboard-success">{success}</p>}
        <div className="dashboard-form-grid">
          <label className="span-2">
            Product name *
            <input
              name="productName"
              value={form.productName}
              onChange={handleChange}
              required
              placeholder="e.g. Classic Running Shoes"
            />
          </label>
          <label>
            Category
            <select name="categoryId" value={form.categoryId === null || form.categoryId === '' ? '' : String(form.categoryId)} onChange={handleChange}>
              <option value="">— Select —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Price *
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Stock quantity *
            <input
              name="stockQuentity"
              type="number"
              min="0"
              value={form.stockQuentity}
              onChange={handleChange}
              required
            />
          </label>
          <label className="span-2">
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Product description" />
          </label>
        </div>
        <div className="dashboard-form-actions">
          <button type="submit" className="dashboard-btn primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update product' : 'Add product'}
          </button>
        </div>

        {productId && (
          <div className="dashboard-form-images">
            <h3>Product images</h3>
            <p className="dashboard-form-hint">Upload images for this product after it has been saved.</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading || !form.productName?.trim()}
            />
            {uploading && <p className="dashboard-loading">Uploading…</p>}
            {images.length > 0 && (
              <ul className="dashboard-image-list">
                {images.map((img) => {
                  const url = img.imageUrl ?? img.ImageUrl
                  const imageId = img.imageId ?? img.ImageId
                  return (
                    <li key={imageId}>
                      <img src={getImageUrl(url) || url} alt="" />
                      <button type="button" className="dashboard-btn small danger" onClick={() => handleDeleteImage(img)}>
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
