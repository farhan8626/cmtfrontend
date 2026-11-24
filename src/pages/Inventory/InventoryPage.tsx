// ============================================================
//  src/pages/Inventory/InventoryPage.tsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { productsApi } from '../../api'
import type { ProductDto, CreateProductRequest, UpdateProductRequest, StockInRequest } from '../../types'
import { formatINR } from '../../utils/format'
import { Modal } from '../../components/common/Modal'
import { PageLoader, Spinner } from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/EmptyState'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, MagnifyingGlassIcon, ArrowUpIcon } from '@heroicons/react/24/outline'

// ── Stock In Modal ──────────────────────────────────────────
function StockInModal({ product, open, onClose, onDone }: {
  product: ProductDto | null; open: boolean;
  onClose: () => void; onDone: () => void;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StockInRequest>()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: StockInRequest) => {
    if (!product) return
    setLoading(true)
    try {
      await productsApi.stockIn(product.id, data)
      toast.success(`Added ${data.quantity} unit(s) to ${product.name}`)
      reset(); onDone(); onClose()
    } catch { toast.error('Failed to add stock.') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Stock In – ${product?.name ?? ''}`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
          <input type="number" min={1} className="input"
            {...register('quantity', { required: 'Required', min: { value: 1, message: 'Min 1' }, valueAsNumber: true })} />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input type="text" className="input" placeholder="e.g. Restock from supplier"
            {...register('notes')} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : 'Add Stock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Product Form Modal ──────────────────────────────────────
type ProductFormData = CreateProductRequest & { id?: number }

function ProductModal({ product, categories, open, onClose, onDone }: {
  product: ProductDto | null; categories: string[];
  open: boolean; onClose: () => void; onDone: () => void;
}) {
  const isEdit = !!product
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product) reset({ ...product })
    else reset({ stockQuantity: 0, lowStockThreshold: 5, purchasePrice: 0, sellingPrice: 0 })
  }, [product, reset])

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      if (isEdit && product) {
        await productsApi.update(product.id, data as UpdateProductRequest)
        toast.success('Product updated.')
      } else {
        await productsApi.create(data as CreateProductRequest)
        toast.success('Product created.')
      }
      onDone(); onClose()
    } catch (e: any) { toast.error(e?.response?.data?.message ?? 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
        {[
          { label: 'SKU *',      name: 'sku',      type: 'text',   col: 1, req: true },
          { label: 'Name *',     name: 'name',     type: 'text',   col: 2, req: true },
          { label: 'Brand',      name: 'brand',    type: 'text',   col: 1, req: false },
        ].map(f => (
          <div key={f.name} className={f.col === 2 ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input type={f.type} className="input"
              {...register(f.name as any, f.req ? { required: `${f.label.replace(' *','')} required` } : {})} />
            {(errors as any)[f.name] && <p className="text-xs text-red-500 mt-1">{(errors as any)[f.name].message}</p>}
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <input type="text" className="input" list="cats"
            {...register('category', { required: 'Category required' })} />
          <datalist id="cats">{categories.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹) *</label>
          <input type="number" step="0.01" min={0} className="input"
            {...register('purchasePrice', { required: true, valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
          <input type="number" step="0.01" min={0} className="input"
            {...register('sellingPrice', { required: true, valueAsNumber: true })} />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
            <input type="number" min={0} className="input"
              {...register('stockQuantity', { valueAsNumber: true })} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
          <input type="number" min={0} className="input"
            {...register('lowStockThreshold', { valueAsNumber: true })} />
        </div>
        <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner size="sm" /> : (isEdit ? 'Save Changes' : 'Create Product')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Page ───────────────────────────────────────────────
export default function InventoryPage() {
  const { isAdmin } = useAuth()
  const [products,   setProducts]   = useState<ProductDto[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [category,   setCategory]   = useState('')
  const [editProduct, setEditProduct] = useState<ProductDto | null>(null)
  const [showForm,    setShowForm]    = useState(false)
  const [stockTarget, setStockTarget] = useState<ProductDto | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      productsApi.getAll(search || undefined, category || undefined),
      productsApi.getCategories(),
    ]).then(([p, c]) => { setProducts(p); setCategories(c) })
      .catch(() => toast.error('Failed to load inventory.'))
      .finally(() => setLoading(false))
  }, [search, category])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        {isAdmin && (
          <button onClick={() => { setEditProduct(null); setShowForm(true) }} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name or SKU…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['SKU','Name','Category','Brand','Stock','Selling Price','Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs">{p.sku}</td>
                    <td className="table-td font-medium">
                      {p.name}
                      {p.isLowStock && <span className="ml-2 badge-red">Low Stock</span>}
                    </td>
                    <td className="table-td">{p.category}</td>
                    <td className="table-td text-gray-400">{p.brand ?? '—'}</td>
                    <td className="table-td">
                      <span className={p.isLowStock ? 'font-bold text-red-600' : ''}>{p.stockQuantity}</span>
                      <span className="text-gray-400 text-xs"> / {p.lowStockThreshold}</span>
                    </td>
                    <td className="table-td font-medium">{formatINR(p.sellingPrice)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setStockTarget(p)}
                          className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
                          <ArrowUpIcon className="h-3 w-3" /> Stock In
                        </button>
                        {isAdmin && (
                          <button onClick={() => { setEditProduct(p); setShowForm(true) }}
                            className="text-xs text-brand-700 hover:underline">Edit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <EmptyState message="No products found." />}
          </div>
        )}
      </div>

      <ProductModal product={editProduct} categories={categories}
        open={showForm} onClose={() => setShowForm(false)} onDone={load} />
      <StockInModal product={stockTarget}
        open={!!stockTarget} onClose={() => setStockTarget(null)} onDone={load} />
    </div>
  )
}
