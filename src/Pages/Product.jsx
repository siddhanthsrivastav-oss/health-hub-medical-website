import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { ChevronDown, CircleUserRound, LogIn, LogOut, PackageCheck, ShoppingCart, Star, UserRound } from "lucide-react";
import { fetchCategory, fetchProduct } from "../Redux/StoreDataSlice";
import "../App.css";
import { useCart } from "../Context/CartContext";
import { useNavigate } from "react-router-dom";
import Footer from "../Components/Footer";
import { formatINR } from "../utils/currency";

const Product = () => {
  const api_url = import.meta.env.VITE_API_URL;
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [submittingRatingId, setSubmittingRatingId] = useState(null);
  const [ratingNotices, setRatingNotices] = useState({});

  const productsSection = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const categoryData = useSelector(
    (state) => state.storeData.category
  );

  const productData = useSelector(
    (state) => state.storeData.products
  );

  const sourceProducts = productData || [];

  const [user, setUser] = useState(() => {
    if (!localStorage.getItem("token")) return null;

    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const customerName = user?.name || "Guest User";
  const totalRatings = sourceProducts.reduce(
    (count, product) => count + (Number(product.ratingCount) || 0),
    0
  );
  const customerRating = totalRatings
    ? sourceProducts.reduce(
      (sum, product) => sum + (Number(product.ratingAverage) || 0) * (Number(product.ratingCount) || 0),
      0
    ) / totalRatings
    : 0;

  useEffect(() => {
    dispatch(fetchCategory());
    dispatch(fetchProduct());
  }, [dispatch]);

  useEffect(() => {
    const refreshProducts = () => {
      if (document.visibilityState === "visible") dispatch(fetchProduct());
    };

    window.addEventListener("focus", refreshProducts);
    document.addEventListener("visibilitychange", refreshProducts);
    return () => {
      window.removeEventListener("focus", refreshProducts);
      document.removeEventListener("visibilitychange", refreshProducts);
    };
  }, [dispatch]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const filteredProducts = sourceProducts.filter((item) => {
    const matchesCategory = selectedCategory
      ? item.category?._id === selectedCategory
      : true;

    const normalize = (value) =>
      String(value || "")
        .normalize("NFKC")
        .toLocaleLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    const searchableText = normalize(
      [
        item.productName,
        item.description,
        item.category?.categoryName
      ].join(" ")
    );

    const searchWords = normalize(searchTerm)
      .split(" ")
      .filter(Boolean);

    const matchesSearch = searchWords.every((word) =>
      searchableText.includes(word)
    );

    return matchesCategory && matchesSearch;
  });

  const searchSuggestions = sourceProducts
    .filter((item) => {
      const term = searchTerm.trim().toLowerCase();

      if (!term) return false;

      const productName = String(
        item.productName || ""
      ).toLowerCase();

      const categoryName = String(
        item.category?.categoryName || ""
      ).toLowerCase();

      return (
        productName.includes(term) ||
        categoryName.includes(term)
      );
    })
    .slice(0, 6);

  const submitSearch = (event) => {
    event.preventDefault();

    productsSection.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAccountMenuOpen(false);
  };

  const { addToCart } = useCart();

  const handleBuyNow = (product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    navigate("/cart");
  };

  const handleRateProduct = async (product, rating) => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      navigate("/login");
      return;
    }

    setSubmittingRatingId(product._id);
    setRatingNotices((notices) => ({ ...notices, [product._id]: "" }));
    try {
      await axios.post(
        `${api_url}/api/product/rating/${product._id}`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRatingNotices((notices) => ({ ...notices, [product._id]: "Thanks for rating" }));
      dispatch(fetchProduct());
    } catch (error) {
      setRatingNotices((notices) => ({
        ...notices,
        [product._id]: error.response?.data?.message || "Could not save your rating"
      }));
    } finally {
      setSubmittingRatingId(null);
    }
  };

  const toggleDescription = (productId) => {
    setExpandedProductId((currentId) =>
      currentId === productId ? null : productId
    );
  };

  return (
    <div className="container">

      {/* ================= HEADER ================= */}

      <header className="hero">

        <div className="hero-toolbar">

          <div className="brand-mark">
            <span className="brand-cross">+</span>
            <span>HealthHub Medical</span>
          </div>

          <div className="hero-toolbar-actions">
            <div className="account-menu" ref={accountMenuRef}>
              <button
                className="account-menu-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                aria-controls="account-menu-list"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
              >
                <CircleUserRound size={19} aria-hidden="true" />
                <span>{user?.name || "Account"}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>

              {isAccountMenuOpen && (
                <div className="account-menu-panel" id="account-menu-list" role="menu">
                  {user ? (
                    <>
                      <button type="button" className="account-menu-item" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); navigate("/my-profile"); }}>
                        <UserRound size={18} aria-hidden="true" />
                        <span>My Profile</span>
                      </button>
                      <button type="button" className="account-menu-item" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); navigate("/cart"); }}>
                        <ShoppingCart size={18} aria-hidden="true" />
                        <span>View Cart</span>
                      </button>
                      <button type="button" className="account-menu-item" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); navigate("/my-orders"); }}>
                        <PackageCheck size={18} aria-hidden="true" />
                        <span>My Orders</span>
                      </button>
                      <div className="account-menu-divider" />
                      <button type="button" className="account-menu-item account-menu-logout" role="menuitem" onClick={handleLogout}>
                        <LogOut size={18} aria-hidden="true" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="account-menu-item" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); navigate("/login"); }}>
                        <LogIn size={18} aria-hidden="true" />
                        <span>Login</span>
                      </button>
                      <button type="button" className="account-menu-item" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); navigate("/cart"); }}>
                        <ShoppingCart size={18} aria-hidden="true" />
                        <span>View Cart</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>


        {/* ================= SEARCH ================= */}

        <form
          className="hero-search"
          onSubmit={submitSearch}
        >
          <span
            className="search-icon"
            aria-hidden="true"
          >
            ⌕
          </span>

          <input
            type="search"
            placeholder="Search medicines, wellness products or healthcare services"
            value={searchTerm}
            onFocus={() => {
              if (searchTerm.trim()) {
                setShowSuggestions(true);
              }
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            aria-label="Search medicines and healthcare products"
          />

          {showSuggestions &&
            searchTerm.trim() &&
            searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                {searchSuggestions.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="search-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();

                      setSearchTerm(item.productName);
                      setShowSuggestions(false);

                      setTimeout(() => {
                        productsSection.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 100);
                    }}
                  >
                    <span className="suggestion-name">
                      {item.productName}
                    </span>
{showSuggestions &&
  searchTerm.trim() &&
  searchSuggestions.length > 0 && (
    <div className="search-suggestions">
      {searchSuggestions.map((item) => (
        <button
          key={item._id}
          type="button"
          className="search-suggestion-item"
          onMouseDown={(e) => {
            e.preventDefault();

            setSearchTerm(item.productName);
            setShowSuggestions(false);

            setTimeout(() => {
              productsSection.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 100);
          }}
        >
          <span className="suggestion-name">
            {item.productName}
          </span>
        </button>
      ))}
    </div>
  )}
                   
                  </button>
                ))}
              </div>
            )}

          <button
            type="submit"
            aria-label="Show matching products"
            onClick={() => setShowSuggestions(false)}
          >
            Search
          </button>
        </form>

        {/* ================= HERO ================= */}

        <div className="hero-top">

          <div className="hero-copy">

            <div className="hero-badge">
              Trusted care • same day delivery
            </div>

            <h1>
              Welcome <span>{customerName}</span>
            </h1>

            <h1>
              Care for every family member
            </h1>

            <p>
              Your trusted medical hall for medicines,
              wellness products, health essentials,
              and everyday care delivered with confidence.
            </p>

            <div className="hero-actions">

              <button
                className="hero-cta"
                onClick={() =>
                  window.scrollTo({
                    top: 500,
                    behavior: "smooth"
                  })
                }
              >
                Shop Now
              </button>

              <a
                className="call-btn"
                href="tel:7081052602"
              >
                Call 7081052602
              </a>

              <a
                className="whatsapp-btn"
                href="https://wa.me/917081052602"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp us
              </a>

            </div>

          </div>


          <div className="hero-visual">

            <div className="medical-card">

              <div className="medical-pill">

                <div className="pill-icon">
                  💊
                </div>

                <div>
                  <h3>Pharma Care</h3>
                  <p>Professional guidance</p>
                </div>

              </div>


              <div className="stats-row">

                <div className="stat-box">
                  <strong>{sourceProducts.length}</strong>
                  <span>Products</span>
                </div>

                <div className="stat-box">
                  <strong>{customerRating.toFixed(1)}</strong>
                  <span>Customer rating</span>
                </div>



              </div>

            </div>

          </div>

        </div>

      </header>


      {/* ================= SERVICES ================= */}

      <section
        className="service-section"
        aria-label="Healthcare services"
      >

        <div className="sectionHeader service-heading">

          <div>

            <p className="eyebrow">
              More than medicines
            </p>

            <h2>
              Healthcare at your doorstep
            </h2>

          </div>

          <a
            className="service-phone"
            href="tel:7081052602"
          >
            Need help? 7081052602
          </a>

          <a
            className="service-phone"
            href="mailto:sundramsrivastav165@gmail.com"
          >
            sundramsrivastav165@gmail.com
          </a>

        </div>


        <div className="service-grid">

          {/* SERVICE 1 */}

          <article className="service-card">

            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=80"
              alt="Doctor consulting with a patient"
            />

            <div>

              <span className="service-label">
                Expert guidance
              </span>

              <h3>
                Consult a doctor
              </h3>

              <p>
                Get trusted medical guidance from
                qualified healthcare professionals.
              </p>

              <a href="tel:7081052602">
                Book consultation
              </a>

            </div>

          </article>


          {/* SERVICE 2 */}

          <article className="service-card">

            <img
              src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80"
              alt="Healthcare laboratory testing"
            />

            <div>

              <span className="service-label">
                At-home care
              </span>

              <h3>
                Book lab tests
              </h3>

              <p>
                Convenient health checks with reliable
                sample collection at home.
              </p>

              <a href="tel:7081052602">
                Book a test
              </a>

            </div>

          </article>


          {/* SERVICE 3 */}

          <article className="service-card">

            <img
              src="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=900&q=80"
              alt="Healthcare delivery package"
            />

            <div>

              <span className="service-label">
                Fast delivery
              </span>

              <h3>
                Medicine delivery
              </h3>

              <p>
                Order your essentials and get dependable
                delivery to your doorstep.
              </p>

              <a href="tel:7081052602">
                Call for delivery
              </a>

            </div>

          </article>

        </div>

      </section>


      {/* ================= CATEGORY ================= */}

      <section className="section">

        <div className="sectionHeader">

          <h2>
            Shop by category
          </h2>

        </div>


        <div className="categoryContainer">

          {categoryData?.map((item) => (

            <div
              className="categoryCard"
              key={item._id}
            >

              <img
                src={item.image}
                alt={item.categoryName}
                className="categoryImage"
              />

              <h4>

                <button
                  onClick={() =>
                    setSelectedCategory(item._id)
                  }
                >
                  {item.categoryName}
                </button>

              </h4>

            </div>

          ))}

        </div>

      </section>


      {/* ================= PRODUCTS ================= */}

      <section
        className="section"
        ref={productsSection}
      >

        <div className="sectionHeader">

          <h2>
            {searchTerm.trim()
              ? `Search results (${filteredProducts.length})`
              : selectedCategory
                ? `Category products (${filteredProducts.length})`
                : `All medicines (${sourceProducts.length})`}
          </h2>

          {(searchTerm.trim() || selectedCategory) && (
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
            >
              All products ({sourceProducts.length})
            </button>
          )}

        </div>


        <div className="productContainer">

          {filteredProducts?.map((item) => (

            <div
              className={`productCard ${expandedProductId === item._id
                  ? "description-open"
                  : ""
                }`}
              key={item._id}
            >

              <div className="imageWrapper">

                <img
                  src={item.images?.[0]?.url}
                  alt={item.productName}
                  className="productImage"
                />

              </div>


              <div className="productInfo">

                <h3>
                  {item.productName}
                </h3>


                <p
                  className={`product-desc ${expandedProductId === item._id
                      ? "is-expanded"
                      : ""
                    }`}
                >
                  {item.description ||
                    "No description available."}
                </p>


                {item.description &&
                  item.description.length > 100 && (

                    <button
                      type="button"
                      className="description-toggle"
                      onClick={() =>
                        toggleDescription(item._id)
                      }
                    >
                      {expandedProductId === item._id
                        ? "Less"
                        : "More"}
                    </button>

                  )}


                <p className="price">
                  {formatINR(item.price)}
                </p>

                <div className="product-rating">
                  <span className="product-rating-average">{(Number(item.ratingAverage) || 0).toFixed(1)}</span>
                  <div className="product-rating-stars" role="group" aria-label={`Rate ${item.productName}`}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        className={`product-rating-star ${rating <= Math.round(Number(item.ratingAverage) || 0) ? "is-filled" : ""}`}
                        aria-label={`Give ${rating} star${rating === 1 ? "" : "s"}`}
                        title={`Rate ${rating} out of 5`}
                        disabled={submittingRatingId === item._id}
                        onClick={() => handleRateProduct(item, rating)}
                      >
                        <Star size={16} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  <span className="product-rating-count">({Number(item.ratingCount) || 0})</span>
                </div>
                {ratingNotices[item._id] && (
                  <p className="product-rating-notice" role="status">{ratingNotices[item._id]}</p>
                )}


                <div className="product-actions">
                  <button
                    className="buyBtn"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add To Cart
                  </button>
                  <button
                    className="secondary-btn buy-now-btn"
                    onClick={() => handleBuyNow(item)}
                  >
                    Buy Now
                  </button>
                </div>

              </div>

            </div>

          ))}


          {filteredProducts.length === 0 && (

            <div className="empty-products">

              <h3>

                {searchTerm.trim()
                  ? "No matching products found"
                  : "No products available"}

              </h3>

              <p>

                {searchTerm.trim()
                  ? "Try a shorter medicine name or another spelling."
                  : "Products will appear here after they are added from the admin panel."}

              </p>

            </div>

          )}

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <Footer />

    </div>
  );
};

export default Product;