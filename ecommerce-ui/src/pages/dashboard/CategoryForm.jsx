import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories, addCategory, updateCategory } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardTable.css'
import './DashboardForm.css'

export default function CategoryForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ categoryName: '', description: '' })

  useEffect(() => {
    if (isEdit) loadCategory()
    else setLoading(false)
  }, [id, isEdit])

  async function loadCategory() {
    setLoading(true)
    try {
      const list = await getCategories()
      const c = Array.isArray(list) ? list.find((x) => String(x.id) === String(id)) : null
      if (c) {
        setForm({ categoryName: c.name ?? '', description: c.description ?? '' })
      } else {
        setError('Category not found')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        categoryName: form.categoryName.trim(),
        description: form.description.trim() || null,
      }
      if (isEdit) {
        await updateCategory({ ...payload, categoryId: Number(id) })
        navigate(`${ADMIN_DASHBOARD_PATH}/categories`)
      } else {
        await addCategory(payload)
        navigate(`${ADMIN_DASHBOARD_PATH}/categories`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="dashboard-loading">Loading…</p>

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h1>{isEdit ? 'Edit category' : 'Add category'}</h1>
          <p className="dash-subtitle">Name this collection and optionally describe it.</p>
        </div>
        <button type="button" className="dashboard-btn" onClick={() => navigate(`${ADMIN_DASHBOARD_PATH}/categories`)}>
          Back to categories
        </button>
      </div>
      <form onSubmit={handleSubmit} className="dashboard-form">
        {error && <p className="dashboard-error">{error}</p>}
        <label>
          Category name *
          <input
            name="categoryName"
            value={form.categoryName}
            onChange={handleChange}
            required
            placeholder="e.g. Shoes"
          />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Optional description" />
        </label>
        <div className="dashboard-form-actions">
          <button type="submit" className="dashboard-btn primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update category' : 'Add category'}
          </button>
        </div>
      </form>
    </div>
  )
}
