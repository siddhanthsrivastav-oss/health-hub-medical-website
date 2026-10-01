import {
    BrowserRouter as Router,
    Routes,
    Route
} from 'react-router-dom'

import Login from './Pages/Login'
import ForgotPassword from './src/Pages/ForgotPassword'
import ProtectedRoute from './Components/Protected'
import Product from './Pages/Product'
import ProductDetail from './Pages/ProductDetail'
import Cart from './Pages/Cart'
import MyOrders from './Pages/MyOrder'
import MyProfile from './Pages/Profile'
import TrackOrder from './Components/TrackOrder'


const App = () => {

    return (
        <Router>

            <Routes>

                {/* Home Page */}
                <Route
                    path="/"
                    element={<Product />}
                />

                <Route
                    path="/product/:id"
                    element={<ProductDetail />}
                />


                {/* Login Page */}
                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* Forgot Password */}
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />


                {/* Cart */}
                <Route
                    path="/cart"
                    element={<Cart />}
                />


                {/* Protected My Orders */}
                <Route
                    path="/my-orders"
                    element={
                        <ProtectedRoute>
                            <MyOrders />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-profile"
                    element={
                        <ProtectedRoute>
                            <MyProfile />
                        </ProtectedRoute>
                    }
                />


                {/* Protected Track Order */}
                <Route
                    path="/track-order/:id"
                    element={
                        <ProtectedRoute>
                            <TrackOrder />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </Router>
    )
}

export default App