import axios from 'axios'
import { ArrowLeft, Check, ShoppingCart, Star, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../Context/CartContext'
import { formatINR } from '../utils/currency'
import './ProductDetail.css'

const ProductDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addToCart } = useCart()
    const apiUrl = import.meta.env.VITE_API_URL
    const [productState, setProductState] = useState({ id: null, product: null, error: '' })
    const [selectedImage, setSelectedImage] = useState(0)
    const [cartMessage, setCartMessage] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        axios.get(`${apiUrl}/api/product/get/${id}`, { signal: controller.signal })
            .then(({ data }) => setProductState({ id, product: data.product, error: '' }))
            .catch((error) => {
                if (!axios.isCancel(error)) {
                    setProductState({
                        id,
                        product: null,
                        error: error.response?.data?.message || 'Could not load this product.'
                    })
                }
            })

        return () => controller.abort()
    }, [apiUrl, id])

    const isLoading = productState.id !== id
    const product = productState.id === id ? productState.product : null
    const errorMessage = productState.id === id ? productState.error : ''

    const handleAddToCart = () => {
        addToCart(product)
        setCartMessage('Added to your cart')
    }

    const handleBuyNow = () => {
        const buyNowState = { buyNowProduct: product }
        if (!localStorage.getItem('token')) {
            navigate('/login', { state: { returnTo: '/cart', ...buyNowState } })
            return
        }
        navigate('/cart', { state: buyNowState })
    }

    if (isLoading) {
        return <main className="product-detail-state">Loading product details...</main>
    }

    if (errorMessage || !product) {
        return (
            <main className="product-detail-state">
                <p role="alert">{errorMessage || 'Product not found.'}</p>
                <button type="button" className="product-detail-back" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} aria-hidden="true" /> Back to store
                </button>
            </main>
        )
    }

    const ratingAverage = Number(product.ratingAverage) || 0
    const ratingCount = Number(product.ratingCount) || 0
    const images = product.images?.filter((image) => image.url) || []
    const activeImage = images[selectedImage]?.url

    return (
        <main className="product-detail-page">
            <button type="button" className="product-detail-back" onClick={() => navigate('/')}>
                <ArrowLeft size={18} aria-hidden="true" /> Back to store
            </button>

            <article className="product-detail-layout">
                <section className="product-detail-gallery" aria-label="Product images">
                    <div className="product-detail-main-image">
                        {activeImage ? (
                            <img src={activeImage} alt={product.productName} />
                        ) : (
                            <div className="product-detail-no-image">No product image</div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="product-detail-thumbnails">
                            {images.map((image, index) => (
                                <button
                                    key={image.publicId || image.url}
                                    type="button"
                                    className={`product-detail-thumbnail ${index === selectedImage ? 'is-selected' : ''}`}
                                    aria-label={`View product image ${index + 1}`}
                                    aria-pressed={index === selectedImage}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img src={image.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="product-detail-info">
                    <p className="product-detail-category">{product.category?.categoryName || 'Health and wellness'}</p>
                    <h1>{product.productName}</h1>

                    <div className="product-detail-rating" aria-label={`${ratingAverage.toFixed(1)} out of 5 from ${ratingCount} customer ratings`}>
                        <strong>{ratingAverage.toFixed(1)}</strong>
                        <span className="product-detail-rating-stars" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={17} fill={star <= Math.round(ratingAverage) ? 'currentColor' : 'none'} />
                            ))}
                        </span>
                        <span>{ratingCount} customer ratings</span>
                    </div>

                    <div className="product-detail-price-block">
                        <span>Price</span>
                        <strong>{formatINR(product.price)}</strong>
                    </div>

                    <div className="product-detail-description">
                        <h2>Product details</h2>
                        <p>{product.description || 'No additional description is available for this product.'}</p>
                    </div>

                    <div className="product-detail-delivery">
                        <Truck size={19} aria-hidden="true" />
                        <span>Delivery details are collected securely at checkout.</span>
                    </div>

                    <div className="product-detail-actions">
                        <button type="button" className="product-detail-add" onClick={handleAddToCart}>
                            <ShoppingCart size={18} aria-hidden="true" /> Add to cart
                        </button>
                        <button type="button" className="product-detail-buy" onClick={handleBuyNow}>
                            Buy now
                        </button>
                    </div>
                    {cartMessage && (
                        <p className="product-detail-cart-message" role="status">
                            <Check size={16} aria-hidden="true" /> {cartMessage}
                        </p>
                    )}
                </section>
            </article>
        </main>
    )
}

export default ProductDetail
