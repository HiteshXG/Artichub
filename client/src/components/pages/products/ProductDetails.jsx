
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { useAuth } from "../../AuthContext.jsx";
// import CommentSection from "./CommentSection.jsx";
// import Loading from "./Loading.jsx";

// const ProductDetails = () => {
//   const { user, token } = useAuth();
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [product, setProduct] = useState(null);
//   const [recommendedProducts, setRecommendedProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [purchaseQuantity, setPurchaseQuantity] = useState(1);

//   // ✅ Fetch Product Details & Recommended Products
//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const response = await axios.get(`https://artichub-efy9.onrender.com/api/product/${id}/`);
//         setProduct(response.data);
//         console.log(response.data)
//       } catch (err) {
//         console.error("Error fetching product:", err);
//         setError("❌ Product not found!");
//       } finally {
//         setLoading(false);
//       }
//     };

//     const fetchRecommendedProducts = async () => {
//       try {
//         const response = await axios.post(`https://artichub-efy9.onrender.com/api/ml/recommendations/`,{ product_id : id });
//         console.log(response)
//         setRecommendedProducts(response.data.recommended_products);
//       } catch (err) {
//         console.error("Error fetching recommended products:", err);
//       }
//     };

//     fetchProduct();
//     fetchRecommendedProducts();
//   }, [id]);

//   // ✅ Load Razorpay Script
//   const loadRazorpay = () => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve(true);
//         return;
//       }
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   // ✅ Handle Buy Now Action
//   const handleBuyNow = async () => {
//     if (!user) {
//       alert("❌ Please log in to purchase.");
//       return;
//     }

//     try {
//       // 🛒 Create Order
//       const orderResponse = await axios.post(
//         `https://artichub-efy9.onrender.com/api/order/create/`,
//         {
//           art: product.id,
//           quantity: purchaseQuantity,
//           amount: 1000, // Adjust based on backend calculation
//           buyer: user.id,
//         },
//         { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
//       );

//       if (orderResponse.status === 201) {
//         const orderId = orderResponse.data.id;

//         // 💳 Create Razorpay Payment Order
//         const paymentResponse = await axios.post(
//           `https://artichub-efy9.onrender.com/api/payment/razorpay/create/`,
//           { order: orderId, buyer_id: user.id },
//           { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
//         );

//         if (paymentResponse.status === 201) {
//           const paymentData = paymentResponse.data;

//           // 🚀 Load Razorpay
//           const loaded = await loadRazorpay();
//           if (!loaded) {
//             alert("❌ Razorpay SDK failed to load.");
//             return;
//           }

//           // 🛡️ Razorpay Options
//           const options = {
//             key: paymentData.key,
//             amount: paymentData.amount,
//             currency: paymentData.currency,
//             name: "ArticHub",
//             description: `Purchase of ${product.title}`,
//             image: product.image,
//             order_id: paymentData.order_id,
//             handler: async (response) => {
//               await verifyPayment(response, orderId);
//             },
//             prefill: {
//               name: user.username || "John Doe",
//               email: user.email || "john@example.com",
//               contact: "9999999999",
//             },
//             theme: { color: "#0071C5" },
//             modal: {
//               escape: true,
//               ondismiss: () => {
//                 alert("❌ Payment cancelled by user.");
//                 navigate("/cancel");
//               },
//             },
//           };

//           // 🎉 Launch Razorpay Window
//           const paymentObject = new window.Razorpay(options);
//           paymentObject.open();
//         } else {
//           alert("❌ Payment API creation failed. Try again.");
//         }
//       } else {
//         alert("❌ Order creation failed. Try again.");
//       }
//     } catch (err) {
//       console.error("Error during order/payment:", err);
//       alert("❌ Purchase failed! Please try again.");
//     }
//   };

//   // ✅ Verify Payment
//   const verifyPayment = async (response, orderId) => {
//     try {
//       const verifyResponse = await axios.post(
//         `https://artichub-efy9.onrender.com/api/payment/razorpay/verify/`,
//         {
//           orderid: orderId,
//           razorpay_order_id: response.razorpay_order_id,
//           razorpay_payment_id: response.razorpay_payment_id,
//           razorpay_signature: response.razorpay_signature,
//         },
//         { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
//       );

//       if (verifyResponse.data.success) {
//         alert("✅ Payment Successful! Order placed.");
//         navigate("/success");
//       } else {
//         alert("⚠️ Payment Verification Failed.");
//         navigate("/failure");
//       }
//     } catch (err) {
//       console.error("Error verifying payment:", err);
//       alert("❌ Payment verification error.");
//       navigate("/failure");
//     }
//   };

//   // ✅ Loading & Error Handling
//   if (loading) return <div className="text-center text-xl"><Loading/></div>;
//   if (error) return <div className="text-center text-xl text-red-500">{error}</div>;
//   if (!product) return <div className="text-center text-xl">❌ No product found!</div>;

//   return (
   
//      <div className="container mx-auto p-4">
//       <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-6">
//         <img src={product.image} alt={product.title} className="w-full h-80 object-cover rounded-lg mb-6 border border-gray-200 shadow-md" />
//         <h2 className="text-4xl font-bold text-blue-500">{product.title}</h2>
//         <p className="text-2xl text-green-600 font-semibold">₹{parseFloat(product.price).toFixed(2)}</p>

//         {/* Purchase Section */}
//         <div className=" p-4 flex items-center justify-between mt-6 text-black">
//           <input
//             type="number"
//             min="1"
//             max={product.quantity}
//             value={purchaseQuantity}
//             onChange={(e) => setPurchaseQuantity(Math.min(Number(e.target.value), product.quantity))}
//             className="w-16 p-2 border border-gray-300 rounded-lg"
//           />
//           <div className="bg-green-500 p-4 rounded-xl">
//           <button onClick={handleBuyNow} className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
//             🛒 Buy Now
//           </button>
//           </div>
//         </div>

//         {/* 📝 Comments */}
//         <CommentSection productId={product.id} />

//         {/* Recommended Products */}
//         <div className="mt-8 text-black">
//           <h3 className="text-3xl text-black font-bold">Recommended Products</h3>
          
// <div className="grid grid-cols-3 gap-4 mt-4">
//   {recommendedProducts.map((rec) => (
//     <div 
//       key={rec.id} 
//       className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:shadow-lg transition"
//       onClick={() => navigate(`/product/${rec.id}`)}
//     >
//       <img src={rec.image} alt={rec.title} className="w-full h-40 object-cover rounded" />
//       <h3 className="mt-2 font-bold text-black">{rec.id}</h3>
//       <h4 className="mt-2 font-bold text-black">{rec.title}</h4>
//       <p className="text-green-600">₹{rec.price}</p>
//     </div>
//   ))}
// </div>

//         </div>
//       </div>
//     </div>

//   );
// };

// export default ProductDetails;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../AuthContext.jsx";
import CommentSection from "./CommentSection.jsx";
import Loading from "./Loading.jsx";

const ProductDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("access-token")

  const [product, setProduct] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`https://artichub-efy9.onrender.com/api/product/${id}/`);
        setProduct(response.data);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("❌ Product not found!");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendedProducts = async () => {
      try {
        const response = await axios.post(`https://artichub-efy9.onrender.com/api/ml/recommendations/`, { product_id: id });
        setRecommendedProducts(response.data.recommended_products);
      } catch (err) {
        console.error("Error fetching recommended products:", err);
      }
    };

    fetchProduct();
    fetchRecommendedProducts();
  }, [id]);

  const handleRecommendedClick = (productId) => {
    navigate(`/product/${productId}`);
    window.location.reload();
  };
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        console.log("✅ Razorpay SDK already loaded.");
        resolve(true);
        return;
      }
      
      console.log("📥 Loading Razorpay SDK...");
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Razorpay SDK Loaded Successfully.");
        resolve(true);
      };
      script.onerror = () => {
        console.error("❌ Failed to load Razorpay SDK.");
        resolve(false);
      };
  
      document.body.appendChild(script);
    });
  };
  

  const verifyPayment = async (response, orderId) => {
        try {
          const verifyResponse = await axios.post(
            `https://artichub-efy9.onrender.com/api/payment/razorpay/verify/`,
            {
              orderid: orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
          );
          console.log("Payment Verified ......")
          if (verifyResponse.data.success) {
            alert("✅ Payment Successful! Order placed.");
            await axios.patch(
              `https://artichub-efy9.onrender.com/api/order/order/orderstatus/${orderId}/`,
              { status: "PAID" },
              { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
            console.log("✅ Order Status Updated!");
            navigate("/success");
          } else {
            alert("⚠️ Payment Verification Failed.");
            navigate("/failure");
          }
        } catch (err) {
          console.error("Error verifying payment:", err);
          alert("❌ Payment verification error.");
          navigate("/failure");
        }
      };
    
  const handleBuyNow = async () => {
    console.log("🚀 Initiating Payment...");
  
    if (!user) {
      alert("❌ Please log in to purchase.");
      return;
    }
  
    try {
      if (!user) {
        return (
          <div className="text-center text-xl text-red-500 mt-10">
            ❌ No user logged in. Please log in to view this page.
          </div>
        );
      }
      
      console.log("📦 Creating Order...");
      console.log("token :" ,token)
      const orderResponse = await axios.post(
        `https://artichub-efy9.onrender.com/api/order/create/`,
        { art: product.id, quantity: purchaseQuantity, amount: product.price, buyer: user.id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
  
      if (orderResponse.status !== 201) {
        console.error("❌ Order creation failed:", orderResponse);
        alert("❌ Order creation failed. Try again.");
        return;
      }
  
      const orderId = orderResponse.data.id;
      console.log("✅ Order Created:", orderId);
  
      console.log("💳 Creating Razorpay Payment Order...");
      const paymentResponse = await axios.post(
        `https://artichub-efy9.onrender.com/api/payment/razorpay/create/`,
        { order_id: orderId, buyer_id: user.id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      console.log(paymentResponse)
      if (paymentResponse.status !== 201 || !paymentResponse.data.order_id) {
        console.error("❌ Razorpay Order creation failed:", paymentResponse);
        alert("❌ Payment API creation failed. Try again.");
        return;
      }
  
      console.log("✅ Razorpay Order Created:", paymentResponse.data);
  
      console.log("🔄 Loading Razorpay SDK...");
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("❌ Razorpay SDK failed to load.");
        return;
      }
  
      console.log("🛡️ Initializing Razorpay...");
      const options = {
        key: paymentResponse.data.key,
        amount: paymentResponse.data.amount,
        currency: paymentResponse.data.currency,
        name: "ArticHub",
        description: `Purchase of ${product.title}`,
        image: product.image,
        order_id: paymentResponse.data.order_id,
        handler: async (response) => {
          console.log("✅ Payment Successful:", response);
          await verifyPayment(response, orderId);
        },
        prefill: {
          name: user.username || "John Doe",
          email: user.email || "john@example.com",
          contact: "9999999999",
        },
        theme: { color: "#0071C5" },
        modal: {
          escape: true,
          ondismiss: () => {
            console.warn("❌ Payment Cancelled by User.");
            alert("❌ Payment cancelled by user.");
            navigate("/cancel");
          },
        },
      };
  
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("❌ Error during order/payment:", err);
      alert("❌ Purchase failed! Please try again.");
    }
  };
  
  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <img src={product.image} alt={product.title} className="w-full h-80 object-cover rounded-lg mb-6" />
        <h2 className="text-4xl font-bold text-gray-800 mb-4">{product.title}</h2>
        <p className="text-2xl text-green-600 font-semibold mb-2">₹{parseFloat(product.price).toFixed(2)}</p>
        <p className="text-lg text-gray-700 mb-2">Category: {product.category}</p>
        <p className="text-lg text-gray-700 mb-2">Condition: {product.condition}</p>
        <p className="text-lg text-gray-700 mb-2">Year of Creation: {product.yearCreation}</p>
        <p className="text-lg text-gray-700 mb-2">Signed: {product.signed ? "✅ Yes" : "❌ No"}</p>
        <div className="justify-self-end">
        <div className="p-4 flex flex-wrap  bg-green-500 rounded-lg">
          <button onClick={handleBuyNow}>Buy </button>
        </div>
        </div>
      </div>

      {/* Recommended Products */}
      <div className="mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Recommended Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recommendedProducts.map((recProduct) => (
            <div key={recProduct.id} className="bg-gray-100 p-4 rounded-lg cursor-pointer hover:shadow-md"
                 onClick={() => handleRecommendedClick(recProduct.id)}>
              <img src={recProduct.image} alt={recProduct.title} className="w-full h-40 object-cover rounded-lg mb-2" />
              <p className="text-lg font-semibold text-gray-800">{recProduct.title}</p>
              <p className="text-green-600 font-bold">₹{recProduct.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
