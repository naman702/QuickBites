// ═══════════════════════════════════════════════════
// QUICKBITE — APP.JS (Production Rebuild)
// ═══════════════════════════════════════════════════

const API_URL = "https://hbalx7ocki.execute-api.ap-south-1.amazonaws.com";
const GOOGLE_CLIENT_ID = "85841838191-0aaklpmqbsnmhi18j7p7p7165gjd1ig3.apps.googleusercontent.com";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop";

// ═══ THEME ═══
(function initTheme() {
    const s = localStorage.getItem("quickbite-theme");
    document.documentElement.setAttribute("data-theme", s || "dark");
})();
function toggleTheme() {
    const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", n);
    localStorage.setItem("quickbite-theme", n);
    const iconName = n === "dark" ? "moon" : "sun";
    const iconEl = document.getElementById("theme-icon");
    if (iconEl) {
        iconEl.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px;"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ═══ STATE ═══
let currentUser = null;
let currentCity = "";
let selectedRestaurant = null;
let cart = [];
let ordersLoaded = false;
let currentSearchTerm = "";
let menuSearchTerm = "";
let activeFilters = { sort: null, rating: null, offer: null, type: null };
let userLocation = { lat: null, lng: null, city: "", state: "", pincode: "", fullAddress: "" };
let leafletMap = null;
let leafletMarker = null;

// ═══ SUPPORTED CITIES ═══
const SUPPORTED_CITIES = [
    { key: "una", name: "Una", state: "Gujarat", lat: 20.8242, lng: 71.0395 },
    { key: "bhiwani", name: "Bhiwani", state: "Haryana", lat: 28.7930, lng: 76.1320 },
    { key: "new delhi", name: "New Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
    { key: "mumbai", name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
    { key: "ahmedabad", name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
    { key: "jaipur", name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 }
];

// ═══ COGNITO-SIMULATED USER STORE ═══
// In production, this would be AWS Cognito User Pool.
// Uses localStorage to simulate DynamoDB Users table.
function getUsersDB() {
    try { return JSON.parse(localStorage.getItem("quickbite-users") || "{}"); } catch(_) { return {}; }
}
function saveUsersDB(db) { localStorage.setItem("quickbite-users", JSON.stringify(db)); }

function hashPassword(pwd) {
    let h = 0;
    for (let i = 0; i < pwd.length; i++) { h = ((h << 5) - h + pwd.charCodeAt(i)) | 0; }
    return "hash_" + Math.abs(h).toString(36) + pwd.length;
}

// ═══ AUTH: EMAIL LOGIN ═══
function switchAuthMode(mode) {
    document.getElementById("auth-tab-login").classList.toggle("active", mode === "login");
    document.getElementById("auth-tab-signup").classList.toggle("active", mode === "signup");
    document.getElementById("login-form").style.display = mode === "login" ? "flex" : "none";
    document.getElementById("signup-form").style.display = mode === "signup" ? "flex" : "none";
    document.getElementById("auth-title").textContent = mode === "login" ? "Welcome Back" : "Create Account";
    document.getElementById("auth-subtitle").textContent = mode === "login"
        ? "Login with your email and password" : "Sign up to start ordering";
    clearAuthErrors();
}

function clearAuthErrors() {
    document.getElementById("login-error").style.display = "none";
    document.getElementById("signup-error").style.display = "none";
}

function showAuthError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg; el.style.display = "block";
}

function handleEmailSignup(e) {
    e.preventDefault(); clearAuthErrors();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim().toLowerCase();
    const pwd = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;
    if (pwd !== confirm) { showAuthError("signup-error", "Passwords do not match."); return; }
    if (pwd.length < 6) { showAuthError("signup-error", "Password must be at least 6 characters."); return; }
    const db = getUsersDB();
    if (db[email]) { showAuthError("signup-error", "Account already exists. Please login instead."); return; }
    db[email] = { name, email, passwordHash: hashPassword(pwd), createdAt: new Date().toISOString() };
    saveUsersDB(db);
    currentUser = { name, email, picture: "", authMethod: "email" };
    saveSession();
    showToast("✅ Account created successfully!", "success");
    showApp();
}

function handleEmailLogin(e) {
    e.preventDefault(); clearAuthErrors();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pwd = document.getElementById("login-password").value;
    const db = getUsersDB();
    if (!db[email]) { showAuthError("login-error", "No account found. Please sign up first."); return; }
    if (db[email].passwordHash !== hashPassword(pwd)) { showAuthError("login-error", "Incorrect password."); return; }
    currentUser = { name: db[email].name, email, picture: "", authMethod: "email" };
    saveSession();
    showToast("✅ Logged in as " + (currentUser.name || email), "success");
    showApp();
}

function saveSession() {
    if (currentUser) {
        sessionStorage.setItem("quickbite-session", JSON.stringify({ user: currentUser, city: currentCity }));
    } else {
        sessionStorage.removeItem("quickbite-session");
    }
}

function togglePasswordVisibility(inputId, btn) {
    const inp = document.getElementById(inputId);
    inp.type = inp.type === "password" ? "text" : "password";
    btn.textContent = inp.type === "password" ? "👁️" : "🙈";
}

// ═══ AUTH: GOOGLE SIGN-IN (Fixed) ═══
function handleGoogleCredential(response) {
    try {
        const p = JSON.parse(atob(response.credential.split(".")[1]));
        currentUser = { name: p.name || "", email: p.email, picture: p.picture || "", authMethod: "google" };
        saveSession();
        showToast("✅ Welcome, " + (currentUser.name || currentUser.email) + "!", "success");
        showApp();
    } catch (_) { showToast("Google sign-in failed. Try email login.", "error"); }
}
// Expose globally for GIS callback
window.handleGoogleCredential = handleGoogleCredential;

function handleGoogleSignInFallback() {
    if (typeof google === "undefined" || !google.accounts) {
        showToast("Google unavailable. Use email login.", "error"); return;
    }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
    google.accounts.id.prompt();
}

// ═══ SIGN-OUT ═══
function handleSignOut() {
    const key = getCartKey(); // capture key BEFORE clearing user
    if (key) localStorage.removeItem(key);
    cart = []; currentUser = null; selectedRestaurant = null; currentCity = "";
    userLocation = { lat: null, lng: null, city: "", state: "", pincode: "", fullAddress: "" };
    saveSession();
    updateCartUI(); closeCartDrawer(); closeProfileDropdown();
    if (typeof google !== "undefined" && google.accounts?.id) google.accounts.id.disableAutoSelect();
    document.getElementById("user-profile").classList.remove("visible");
    document.getElementById("tabs-container").classList.remove("visible");
    document.getElementById("login-card").style.display = "block";
    const navCartBtn = document.getElementById("nav-cart-btn");
    if (navCartBtn) navCartBtn.style.display = "none";
    document.getElementById("login-form").reset();
    document.getElementById("signup-form").reset();
    const orderForm = document.getElementById("order-form");
    orderForm.reset(); orderForm.style.display = "block";
    hide(document.getElementById("success")); hide(document.getElementById("error"));
    const banner = document.getElementById("city-banner");
    if (banner) banner.style.display = "none";
    hideLocationModal();
    goToStep("restaurants");
    showToast("👋 Signed out", "info");
}

function showApp() {
    document.getElementById("login-card").style.display = "none";
    document.getElementById("tabs-container").classList.add("visible");
    const displayName = currentUser.name || currentUser.email.split("@")[0];
    const avatarSrc = currentUser.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f97316&color=fff&size=64`;
    document.getElementById("user-avatar").src = avatarSrc;
    // Populate profile dropdown
    const dn = document.getElementById("dropdown-name");
    const de = document.getElementById("dropdown-email");
    if (dn) dn.textContent = displayName;
    if (de) de.textContent = currentUser.email;
    document.getElementById("history-welcome").innerHTML = `Showing orders for <strong>${currentUser.email}</strong>`;
    document.getElementById("user-profile").classList.add("visible");
    // Show header cart button
    const navCartBtn = document.getElementById("nav-cart-btn");
    if (navCartBtn) navCartBtn.style.display = "grid";
    restoreCart();
    // Show location permission modal
    showLocationModal();
}

// ═══ PROFILE DROPDOWN ═══
function toggleProfileDropdown() {
    const dd = document.getElementById("profile-dropdown");
    if (!dd) return;
    dd.classList.toggle("visible");
}
function closeProfileDropdown() {
    const dd = document.getElementById("profile-dropdown");
    if (dd) dd.classList.remove("visible");
}
// Close dropdown when clicking outside
document.addEventListener("click", function(e) {
    const profile = document.getElementById("user-profile");
    if (profile && !profile.contains(e.target)) closeProfileDropdown();
});
// Close cart drawer and dropdown on Escape
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") { closeCartDrawer(); closeProfileDropdown(); }
});

// ═══ LOCATION DETECTION SYSTEM ═══
function showLocationModal() {
    document.getElementById("location-modal").classList.add("visible");
    document.getElementById("location-modal-overlay").classList.add("visible");
}

function hideLocationModal() {
    document.getElementById("location-modal").classList.remove("visible");
    document.getElementById("location-modal-overlay").classList.remove("visible");
}

function requestGPSLocation() {
    const statusEl = document.getElementById("loc-modal-status");
    const spinnerEl = document.getElementById("loc-modal-spinner");
    const btnEl = document.getElementById("loc-modal-gps-btn");
    statusEl.textContent = "Detecting your location...";
    spinnerEl.style.display = "inline-block";
    btnEl.disabled = true;

    if (!navigator.geolocation) {
        statusEl.textContent = "Geolocation not supported. Please select your city manually.";
        spinnerEl.style.display = "none";
        btnEl.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            userLocation.lat = latitude;
            userLocation.lng = longitude;
            statusEl.textContent = "Got coordinates! Detecting city...";
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
                const data = await resp.json();
                if (data?.address) {
                    const addr = data.address;
                    const detectedCity = addr.city || addr.town || addr.county || addr.state_district || "";
                    const detectedState = addr.state || "";
                    const detectedPincode = addr.postcode || "";
                    userLocation.city = detectedCity;
                    userLocation.state = detectedState;
                    userLocation.pincode = detectedPincode;
                    userLocation.fullAddress = data.display_name || "";

                    const matched = matchCityToSupported(detectedCity, detectedState);
                    if (matched) {
                        currentCity = matched.name + ", " + matched.state;
                        saveSession();
                        hideLocationModal();
                        updateCityBanner();
                        goToStep("restaurants");
                        renderRestaurants();
                        showToast(`📍 Location: ${currentCity}`, "success");
                    } else {
                        statusEl.innerHTML = `📍 Detected: <strong>${detectedCity}, ${detectedState}</strong><br>🚫 Delivery not available here yet. Please select a supported city below.`;
                        spinnerEl.style.display = "none";
                        btnEl.disabled = false;
                    }
                } else {
                    statusEl.textContent = "Could not determine city. Please select manually.";
                    spinnerEl.style.display = "none";
                    btnEl.disabled = false;
                }
            } catch (_) {
                statusEl.textContent = "Network error. Please select your city manually.";
                spinnerEl.style.display = "none";
                btnEl.disabled = false;
            }
        },
        (err) => {
            statusEl.textContent = err.code === 1
                ? "Location access denied. Please select your city manually."
                : "Could not detect location. Please select your city manually.";
            spinnerEl.style.display = "none";
            btnEl.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
}

function matchCityToSupported(city, state) {
    if (!city) return null;
    const c = city.toLowerCase().trim();
    const s = (state || "").toLowerCase().trim();
    for (const sc of SUPPORTED_CITIES) {
        if (c.includes(sc.key) || c.includes(sc.name.toLowerCase())) return sc;
        if (sc.key === "una" && (c.includes("gir somnath") || c.includes("junagadh"))) return sc;
        if (sc.key === "new delhi" && (c.includes("delhi") || s.includes("delhi"))) return sc;
    }
    return null;
}

function selectCityManual(cityKey) {
    const city = SUPPORTED_CITIES.find(c => c.key === cityKey);
    if (!city) return;
    currentCity = city.name + ", " + city.state;
    userLocation.city = city.name;
    userLocation.state = city.state;
    userLocation.lat = city.lat;
    userLocation.lng = city.lng;
    saveSession();
    hideLocationModal();
    updateCityBanner();
    goToStep("restaurants");
    renderRestaurants();
    showToast(`📍 Location set: ${currentCity}`, "success");
}

function updateCityBanner() {
    const banner = document.getElementById("city-banner");
    if (banner && currentCity) {
        banner.innerHTML = `📍 ${currentCity} <button class="city-change-btn" onclick="changeCity()">Change</button>`;
        banner.style.display = "flex";
    }
}

function changeCity() {
    if (cart.length > 0) {
        if (!confirm("Changing city will clear your cart. Continue?")) return;
        cart = []; saveCart(); updateCartUI();
    }
    currentCity = "";
    selectedRestaurant = null;
    saveSession();
    const banner = document.getElementById("city-banner");
    if (banner) banner.style.display = "none";
    showLocationModal();
    goToStep("restaurants");
}

// ═══ SESSION RESTORE ON REFRESH → always go to home ═══
document.addEventListener("DOMContentLoaded", function () {
    // ═══ SPLASH SCREEN DISMISSAL ═══
    const splash = document.getElementById("splash-screen");
    if (splash) {
        setTimeout(() => {
            splash.classList.add("fade-out");
            document.body.classList.add("loaded");
            setTimeout(() => splash.remove(), 700);
        }, 2600);
    }

    // ═══ ENSURE CART IS HIDDEN ON LOAD ═══
    // Cart drawer and overlay must be closed on every page load
    closeCartDrawer();
    const cartBar = document.getElementById("cart-bar");
    if (cartBar) cartBar.classList.remove("visible");
    // Footer starts in minimal state (no items yet)
    updateFooter(0);

    document.getElementById("theme-icon").textContent =
        document.documentElement.getAttribute("data-theme") === "dark" ? "🌙" : "☀️";
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
    document.getElementById("order-form").addEventListener("submit", handleOrderSubmit);
    document.querySelectorAll("[data-service]").forEach(el => {
        el.addEventListener("mouseenter", () => showTooltip(el));
        el.addEventListener("mouseleave", hideTooltip);
    });
    // Check for Google button fallback
    setTimeout(() => {
        if (!document.querySelector(".g_id_signin iframe")) {
            const fb = document.getElementById("google-btn-fallback");
            if (fb) fb.style.display = "flex";
        }
    }, 2000);
    // Restore session — but always start at location step (clean refresh)
    try {
        const sessStr = sessionStorage.getItem("quickbite-session");
        if (sessStr) {
            const sess = JSON.parse(sessStr);
            // Support legacy session format (just user object) and new format {user, city}
            if (sess.user && sess.user.email) {
                currentUser = sess.user;
                if (sess.city) currentCity = sess.city;
                showApp();
                if (currentCity) {
                    hideLocationModal();
                    updateCityBanner();
                    goToStep("restaurants");
                    renderRestaurants();
                }
                // After restoring cart, ensure UI reflects correct state (no auto-open)
                closeCartDrawer();
            } else if (sess.email) {
                currentUser = sess;
                showApp();
                closeCartDrawer();
            }
        }
    } catch (_) {}
});
// ═══════════════════════════════════════════════════════════════
// CITY-BASED RESTAURANT DATABASE (6 Cities, 26 Restaurants)
// Simulates DynamoDB Restaurants table with GSI on city
// ═══════════════════════════════════════════════════════════════
const CITY_RESTAURANTS = {
    "una": [
        { id:101, name:"Grand Shiva Restaurant", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Pure Veg", rating:4.5, time:"25-30 min", priceRange:"₹₹", tag:"Popular", offer:"10% OFF", isVeg:true, avgPrice:130,
          menu:[
            {name:"Gujarati Thali",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal, sabzi, roti, rice, papad, sweet",isVeg:true},
            {name:"Paneer Butter Masala",price:160,image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop",desc:"Creamy paneer in rich tomato gravy",isVeg:true},
            {name:"Dal Fry with Rice",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Yellow dal tadka served with steamed rice",isVeg:true},
            {name:"Masala Dosa",price:90,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Crispy dosa with spiced potato filling",isVeg:true},
            {name:"Chole Bhature",price:110,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spicy chickpea curry with fried bread",isVeg:true},
            {name:"Gulab Jamun (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Soft milk dumplings in cardamom syrup",isVeg:true}
        ]},
        { id:102, name:"Ajmeri Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Non-Veg • Biryani", rating:4.3, time:"30-35 min", priceRange:"₹₹₹", tag:"Top Rated", offer:"15% OFF", isVeg:false, avgPrice:200,
          menu:[
            {name:"Chicken Biryani",price:199,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Fragrant basmati rice with spiced chicken",isVeg:false},
            {name:"Butter Chicken",price:220,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Tender chicken in buttery tomato gravy",isVeg:false},
            {name:"Mutton Rogan Josh",price:280,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Kashmiri style slow-cooked mutton curry",isVeg:false},
            {name:"Paneer Tikka",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Chargrilled paneer with mint chutney",isVeg:true},
            {name:"Dal Makhani",price:150,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Slow-cooked black lentils in cream",isVeg:true},
            {name:"Naan Basket",price:60,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Butter naan + garlic naan combo",isVeg:true}
        ]},
        { id:103, name:"Shalimar Hotel", image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=120&h=120&fit=crop",
          cuisine:"Fast Food • Snacks • Chinese", rating:4.0, time:"15-20 min", priceRange:"₹", tag:"Quick Bites", offer:"20% OFF", isVeg:false, avgPrice:110,
          menu:[
            {name:"Veg Burger",price:80,image:"https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=300&h=200&fit=crop",desc:"Crispy paneer patty with fresh veggies",isVeg:true},
            {name:"Chicken Burger",price:120,image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",desc:"Grilled chicken with cheese & sauce",isVeg:false},
            {name:"Hakka Noodles",price:100,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Stir-fried vegetable noodles",isVeg:true},
            {name:"French Fries",price:70,image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",desc:"Crispy golden salted fries",isVeg:true},
            {name:"Manchurian Dry",price:110,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Crispy veg balls in spicy sauce",isVeg:true},
            {name:"Cold Coffee",price:60,image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop",desc:"Chilled coffee with ice cream",isVeg:true}
        ]},
        { id:104, name:"Radhe Krishna Dining", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"South Indian • Pure Veg", rating:4.4, time:"20-25 min", priceRange:"₹", tag:"Healthy", offer:"", isVeg:true, avgPrice:85,
          menu:[
            {name:"Masala Dosa",price:80,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Crispy crepe with spiced potato filling",isVeg:true},
            {name:"Idli Sambar (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Steamed rice cakes with lentil soup",isVeg:true},
            {name:"Uttapam",price:90,image:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",desc:"Thick pancake topped with onion & tomato",isVeg:true},
            {name:"Pav Bhaji",price:100,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spiced mashed veggies with buttered pav",isVeg:true},
            {name:"Medu Vada (3 pcs)",price:70,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Crispy lentil donuts with chutney",isVeg:true},
            {name:"Filter Coffee",price:40,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Traditional South Indian filter coffee",isVeg:true}
        ]},
        { id:105, name:"Shreeji Kathiyawadi", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Kathiyawadi • Gujarati", rating:4.2, time:"25-35 min", priceRange:"₹₹", tag:"Regional", offer:"", isVeg:true, avgPrice:140,
          menu:[
            {name:"Kathiyawadi Thali",price:200,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Traditional platter with bajra roti, ringna batata, kadhi",isVeg:true},
            {name:"Sev Tameta Nu Shaak",price:100,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Tangy tomato curry with crispy sev",isVeg:true},
            {name:"Undhiyu",price:160,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Mixed vegetable curry — winter specialty",isVeg:true},
            {name:"Bajra Rotla",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Millet flatbread with ghee",isVeg:true},
            {name:"Chaas (Buttermilk)",price:30,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk — refreshing",isVeg:true},
            {name:"Mohanthal",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Traditional besan sweet with nuts",isVeg:true}
        ]}
    ],
    "bhiwani": [
        { id:201, name:"Choudhary Dhaba", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Haryanvi • North Indian", rating:4.2, time:"25-30 min", priceRange:"₹₹", tag:"Local Favorite", offer:"10% OFF", isVeg:false, avgPrice:150,
          menu:[
            {name:"Desi Ghee Thali",price:200,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Full thali cooked in pure desi ghee",isVeg:true},
            {name:"Butter Chicken",price:220,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Classic punjabi butter chicken",isVeg:false},
            {name:"Kadhi Chawal",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Yogurt curry with pakodas & rice",isVeg:true},
            {name:"Tandoori Roti (2 pcs)",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Clay oven baked wheat roti",isVeg:true},
            {name:"Churma",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crushed wheat sweet with ghee",isVeg:true},
            {name:"Lassi (Sweet)",price:50,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Thick Haryanvi lassi with malai",isVeg:true}
        ]},
        { id:202, name:"Royal Darbar", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Kebabs • Biryani", rating:4.4, time:"30-40 min", priceRange:"₹₹₹", tag:"Premium", offer:"20% OFF", isVeg:false, avgPrice:230,
          menu:[
            {name:"Mutton Biryani",price:250,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Dum-cooked biryani with tender mutton",isVeg:false},
            {name:"Seekh Kebab (6 pcs)",price:180,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Minced mutton kebabs on skewers",isVeg:false},
            {name:"Paneer Tikka",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Chargrilled paneer with mint chutney",isVeg:true},
            {name:"Chicken Korma",price:230,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Creamy cashew-based chicken curry",isVeg:false},
            {name:"Rumali Roti",price:40,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Thin handkerchief bread",isVeg:true},
            {name:"Gulab Jamun (4 pcs)",price:60,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Warm milk dumplings in cardamom syrup",isVeg:true}
        ]},
        { id:203, name:"Bhiwani Fast Food", image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
          cuisine:"Burgers • Pizza • Shakes", rating:3.9, time:"15-20 min", priceRange:"₹", tag:"Fast", offer:"", isVeg:false, avgPrice:100,
          menu:[
            {name:"Aloo Tikki Burger",price:60,image:"https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=300&h=200&fit=crop",desc:"Spiced potato patty burger",isVeg:true},
            {name:"Chicken Pizza",price:180,image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",desc:"Loaded chicken & cheese pizza",isVeg:false},
            {name:"Loaded Cheese Fries",price:90,image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop",desc:"Cheese fries with jalapeños",isVeg:true},
            {name:"Chocolate Shake",price:80,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Thick chocolate milkshake",isVeg:true},
            {name:"Garlic Bread",price:70,image:"https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=300&h=200&fit=crop",desc:"Buttery garlic bread with herbs",isVeg:true},
            {name:"Paneer Wrap",price:100,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Grilled paneer in a wheat wrap",isVeg:true}
        ]},
        { id:204, name:"Haryana Haveli", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Punjabi • Haryanvi • Thali", rating:4.1, time:"25-35 min", priceRange:"₹₹", tag:"Family", offer:"15% OFF", isVeg:false, avgPrice:160,
          menu:[
            {name:"Haryanvi Non-Veg Thali",price:250,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Chicken, dal, roti, rice, raita, sweet",isVeg:false},
            {name:"Sarson Ka Saag",price:130,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Mustard greens with makki roti",isVeg:true},
            {name:"Tandoori Chicken (Half)",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Marinated clay oven roasted chicken",isVeg:false},
            {name:"Bajra Khichdi",price:100,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Millet porridge with ghee — comfort food",isVeg:true},
            {name:"Rabri",price:70,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Thickened sweetened milk dessert",isVeg:true},
            {name:"Masala Chaas",price:40,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk with cumin",isVeg:true}
        ]}
    ],
    "new delhi": [
        { id:301, name:"Karim's", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Old Delhi • Mughlai • Since 1913", rating:4.6, time:"30-40 min", priceRange:"₹₹₹", tag:"Iconic", offer:"", isVeg:false, avgPrice:300,
          menu:[
            {name:"Mutton Burrah",price:350,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Jama Masjid's legendary mutton chops",isVeg:false},
            {name:"Chicken Jahangiri",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Royal Mughal chicken curry",isVeg:false},
            {name:"Mutton Biryani",price:300,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Authentic Old Delhi style biryani",isVeg:false},
            {name:"Seekh Kebab",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Minced meat skewers from tandoor",isVeg:false},
            {name:"Dal Makhani",price:180,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"24-hour slow-cooked black lentils",isVeg:true},
            {name:"Kheer",price:80,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Rice pudding with dry fruits",isVeg:true}
        ]},
        { id:302, name:"Haldiram's", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Chaat • Sweets • Pure Veg", rating:4.3, time:"15-20 min", priceRange:"₹₹", tag:"Trusted", offer:"10% OFF", isVeg:true, avgPrice:140,
          menu:[
            {name:"Chole Bhature",price:130,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spicy chickpeas with fluffy fried bread",isVeg:true},
            {name:"Pani Puri (6 pcs)",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with tangy spiced water",isVeg:true},
            {name:"Raj Kachori",price:90,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Giant kachori with chutneys & yogurt",isVeg:true},
            {name:"Aloo Tikki Chaat",price:80,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy potato patties with toppings",isVeg:true},
            {name:"Rasgulla (4 pcs)",price:80,image:"https://images.unsplash.com/photo-1645696301019-30a58e1a5e2d?w=300&h=200&fit=crop",desc:"Bengali cottage cheese balls in syrup",isVeg:true},
            {name:"Masala Dosa",price:110,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"South Indian crepe with potato masala",isVeg:true}
        ]},
        { id:303, name:"Moti Mahal Delux", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Tandoori • Butter Chicken Origin", rating:4.5, time:"25-35 min", priceRange:"₹₹₹", tag:"Heritage", offer:"15% OFF", isVeg:false, avgPrice:280,
          menu:[
            {name:"Butter Chicken (OG)",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"The original — invented here in 1950s",isVeg:false},
            {name:"Tandoori Chicken (Full)",price:400,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Iconic clay oven roasted whole chicken",isVeg:false},
            {name:"Dal Moti Mahal",price:200,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Signature creamy black dal",isVeg:true},
            {name:"Paneer Tikka Masala",price:220,image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300&h=200&fit=crop",desc:"Paneer in spiced tomato-cream gravy",isVeg:true},
            {name:"Naan Basket",price:80,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Butter, garlic & plain naan combo",isVeg:true},
            {name:"Kulfi Falooda",price:120,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Traditional kulfi with falooda noodles",isVeg:true}
        ]},
        { id:304, name:"Sagar Ratna", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"South Indian • Pure Veg", rating:4.2, time:"20-25 min", priceRange:"₹₹", tag:"Healthy", offer:"", isVeg:true, avgPrice:130,
          menu:[
            {name:"Paper Masala Dosa",price:120,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Extra crispy thin dosa with masala",isVeg:true},
            {name:"Rava Idli (4 pcs)",price:90,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Semolina idlis with coconut chutney",isVeg:true},
            {name:"Mysore Masala Dosa",price:130,image:"https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&h=200&fit=crop",desc:"Dosa with red chutney & potato",isVeg:true},
            {name:"Uttapam",price:100,image:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=300&h=200&fit=crop",desc:"Thick pancake with onion & veggies",isVeg:true},
            {name:"Sambar Vada (2 pcs)",price:80,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop",desc:"Lentil donuts soaked in sambar",isVeg:true},
            {name:"Filter Coffee",price:50,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Authentic South Indian filter coffee",isVeg:true}
        ]}
    ],
    "mumbai": [
        { id:401, name:"Bademiya", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Kebabs • Rolls • Street Legend", rating:4.4, time:"20-30 min", priceRange:"₹₹", tag:"Iconic", offer:"10% OFF", isVeg:false, avgPrice:200,
          menu:[
            {name:"Chicken Seekh Roll",price:150,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Minced chicken kebab wrapped in roomali",isVeg:false},
            {name:"Mutton Boti Kebab",price:250,image:"https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",desc:"Juicy mutton pieces from tandoor",isVeg:false},
            {name:"Chicken Tikka",price:200,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Spiced boneless chicken from clay oven",isVeg:false},
            {name:"Paneer Tikka Roll",price:130,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Grilled paneer wrapped in roti",isVeg:true},
            {name:"Bhuna Gosht",price:280,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Dry roasted mutton — spicy & rich",isVeg:false},
            {name:"Roomali Roti",price:30,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Paper-thin bread",isVeg:true}
        ]},
        { id:402, name:"Swati Snacks", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Gujarati Snacks • Pure Veg", rating:4.6, time:"20-25 min", priceRange:"₹₹", tag:"Premium Veg", offer:"", isVeg:true, avgPrice:150,
          menu:[
            {name:"Panki Chatni",price:120,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Rice flour pancake steamed in banana leaf",isVeg:true},
            {name:"Dhokla",price:80,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Steamed gram flour cake with green chutney",isVeg:true},
            {name:"Sev Puri (6 pcs)",price:90,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with sev & chutneys",isVeg:true},
            {name:"Dal Dhokli",price:160,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Gujarati dal with wheat flour dumplings",isVeg:true},
            {name:"Handvo",price:100,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Savory mixed lentil cake",isVeg:true},
            {name:"Mango Lassi",price:100,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Chilled mango yogurt drink",isVeg:true}
        ]},
        { id:403, name:"Britannia & Co.", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Parsi • Iranian • Since 1923", rating:4.5, time:"30-40 min", priceRange:"₹₹₹", tag:"Heritage", offer:"15% OFF", isVeg:false, avgPrice:300,
          menu:[
            {name:"Berry Pulao",price:380,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Signature Parsi rice with berries & mutton",isVeg:false},
            {name:"Sali Boti",price:320,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Parsi mutton with crispy potato straws",isVeg:false},
            {name:"Dhansak",price:280,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Lentil & meat curry — Parsi classic",isVeg:false},
            {name:"Caramel Custard",price:100,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Classic wobbly Parsi caramel pudding",isVeg:true},
            {name:"Raspberry Soda",price:60,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Iconic house-made raspberry drink",isVeg:true},
            {name:"Patra Ni Machhi",price:300,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Fish wrapped in banana leaf with chutney",isVeg:false}
        ]},
        { id:404, name:"Shree Thaker Bhojanalay", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Pure Veg", rating:4.5, time:"25-30 min", priceRange:"₹₹", tag:"Authentic", offer:"", isVeg:true, avgPrice:180,
          menu:[
            {name:"Unlimited Gujarati Thali",price:350,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal, shaak, roti, rice, farsan, sweet — unlimited",isVeg:true},
            {name:"Vada Pav (2 pcs)",price:40,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Mumbai's iconic street snack",isVeg:true},
            {name:"Pav Bhaji",price:110,image:"https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=300&h=200&fit=crop",desc:"Spiced mashed veggies with buttered pav",isVeg:true},
            {name:"Bombay Sandwich",price:80,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Classic Mumbai street sandwich with chutney",isVeg:true},
            {name:"Shrikhand",price:80,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Sweet strained yogurt with saffron",isVeg:true},
            {name:"Masala Chai",price:30,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Strong spiced tea — cutting chai style",isVeg:true}
        ]}
    ],
    "ahmedabad": [
        { id:501, name:"Manek Chowk Food Stalls", image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=120&h=120&fit=crop",
          cuisine:"Street Food • Chaat • Night Market", rating:4.3, time:"15-20 min", priceRange:"₹", tag:"Famous", offer:"", isVeg:true, avgPrice:80,
          menu:[
            {name:"Khaman Dhokla",price:50,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Fluffy steamed gram flour snack",isVeg:true},
            {name:"Dabeli",price:30,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Sweet-spicy potato pav with pomegranate",isVeg:true},
            {name:"Sev Khamani",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crumbled dhokla with sev & chutney",isVeg:true},
            {name:"Pani Puri (6 pcs)",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy puris with spiced water",isVeg:true},
            {name:"Kulhad Pizza",price:100,image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=200&fit=crop",desc:"Manek Chowk special — pizza in clay cup",isVeg:true},
            {name:"Mango Gola",price:30,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Crushed ice with mango syrup",isVeg:true}
        ]},
        { id:502, name:"Gordhan Thal", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Gujarati Thali • Premium", rating:4.5, time:"25-35 min", priceRange:"₹₹₹", tag:"Premium", offer:"10% OFF", isVeg:true, avgPrice:250,
          menu:[
            {name:"Royal Gujarati Thali",price:400,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"25+ items — dal, sabzi, roti, rice, farsan, mithai",isVeg:true},
            {name:"Undhiyu",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Mixed winter vegetable speciality",isVeg:true},
            {name:"Khandvi",price:100,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Gram flour rolls with tempering",isVeg:true},
            {name:"Methi Thepla",price:60,image:"https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=300&h=200&fit=crop",desc:"Fenugreek flatbread with chaas",isVeg:true},
            {name:"Basundi",price:90,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Thickened sweet milk with dry fruits",isVeg:true},
            {name:"Chaas Masala",price:40,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Spiced buttermilk — Gujarati style",isVeg:true}
        ]},
        { id:503, name:"Das Khaman House", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Farsan • Snacks • Pure Veg", rating:4.4, time:"10-15 min", priceRange:"₹", tag:"Quick", offer:"20% OFF", isVeg:true, avgPrice:70,
          menu:[
            {name:"Das Special Khaman",price:60,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Signature soft khaman with tempering",isVeg:true},
            {name:"Sandwich Dhokla",price:80,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Layered dhokla with green chutney",isVeg:true},
            {name:"Fafda Jalebi",price:70,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crispy gram flour strips with sweet jalebi",isVeg:true},
            {name:"Kachori (2 pcs)",price:50,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Stuffed fried pastry — spicy filling",isVeg:true},
            {name:"Gathiya",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy gram flour sticks — tea-time snack",isVeg:true},
            {name:"Masala Chai",price:20,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Strong Gujarati tea with spices",isVeg:true}
        ]},
        { id:504, name:"Lucky Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Chinese • Punjabi • Multi-cuisine", rating:4.1, time:"20-30 min", priceRange:"₹₹", tag:"All-rounder", offer:"", isVeg:false, avgPrice:160,
          menu:[
            {name:"Chicken Manchurian",price:180,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Indo-Chinese chicken in spicy sauce",isVeg:false},
            {name:"Veg Fried Rice",price:120,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Wok-tossed rice with vegetables",isVeg:true},
            {name:"Paneer Chilli",price:160,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Crispy paneer in Indo-Chinese sauce",isVeg:true},
            {name:"Hakka Noodles",price:110,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Stir-fried noodles with veggies",isVeg:true},
            {name:"Sweet Corn Soup",price:80,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&h=200&fit=crop",desc:"Thick creamy sweet corn soup",isVeg:true},
            {name:"Brownie with Ice Cream",price:120,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Warm chocolate brownie with vanilla",isVeg:true}
        ]}
    ],
    "jaipur": [
        { id:601, name:"Laxmi Mishthan Bhandar (LMB)", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&h=120&fit=crop",
          cuisine:"Rajasthani • Sweets • Since 1727", rating:4.5, time:"20-25 min", priceRange:"₹₹", tag:"Heritage", offer:"10% OFF", isVeg:true, avgPrice:150,
          menu:[
            {name:"Rajasthani Thali",price:250,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Dal baati churma, gatte, papad, sweet",isVeg:true},
            {name:"Dal Baati Churma",price:180,image:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&h=200&fit=crop",desc:"Rajasthan's signature dish — 3 baatis with dal & churma",isVeg:true},
            {name:"Ghevar",price:120,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Disc-shaped Rajasthani sweet — festival special",isVeg:true},
            {name:"Pyaz Kachori",price:50,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Flaky pastry with spicy onion filling",isVeg:true},
            {name:"Paneer Ghevar",price:100,image:"https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=200&fit=crop",desc:"Unique paneer-stuffed ghevar",isVeg:true},
            {name:"Malpua (2 pcs)",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Deep-fried sweet pancakes with rabri",isVeg:true}
        ]},
        { id:602, name:"Rawat Mishthan Bhandar", image:"https://images.unsplash.com/photo-1596797038530-2c107229654b?w=120&h=120&fit=crop",
          cuisine:"Kachori • Sweets • Famous", rating:4.4, time:"15-20 min", priceRange:"₹", tag:"Must Try", offer:"", isVeg:true, avgPrice:80,
          menu:[
            {name:"Pyaz Ki Kachori",price:40,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Jaipur's #1 — flaky onion kachori",isVeg:true},
            {name:"Mawa Kachori",price:60,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Sweet kachori filled with mawa — unique",isVeg:true},
            {name:"Mirchi Vada",price:30,image:"https://images.unsplash.com/photo-1606491956689-2ea866880049?w=300&h=200&fit=crop",desc:"Stuffed chilli fritter — spicy snack",isVeg:true},
            {name:"Samosa (2 pcs)",price:30,image:"https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=200&fit=crop",desc:"Crispy potato-filled triangles",isVeg:true},
            {name:"Rabri Jalebi",price:80,image:"https://images.unsplash.com/photo-1601303516-a06f8d3a0035?w=300&h=200&fit=crop",desc:"Crispy jalebi soaked in thick rabri",isVeg:true},
            {name:"Lassi (Sweet)",price:50,image:"https://images.unsplash.com/photo-1571006682205-18e9c60baad7?w=300&h=200&fit=crop",desc:"Thick malai lassi — Rajasthani style",isVeg:true}
        ]},
        { id:603, name:"Handi Restaurant", image:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&h=120&fit=crop",
          cuisine:"Mughlai • Tandoori • Non-Veg", rating:4.3, time:"30-40 min", priceRange:"₹₹₹", tag:"Popular", offer:"15% OFF", isVeg:false, avgPrice:250,
          menu:[
            {name:"Handi Chicken",price:280,image:"https://images.unsplash.com/photo-1603894584373-5cb1cd2d5de4?w=300&h=200&fit=crop",desc:"Signature clay pot chicken curry",isVeg:false},
            {name:"Mutton Biryani",price:260,image:"https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",desc:"Aromatic dum biryani with tender mutton",isVeg:false},
            {name:"Laal Maas",price:300,image:"https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop",desc:"Fiery Rajasthani red mutton curry",isVeg:false},
            {name:"Tandoori Platter",price:350,image:"https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&h=200&fit=crop",desc:"Mixed grill — chicken, seekh, fish tikka",isVeg:false},
            {name:"Dal Makhani",price:160,image:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop",desc:"Rich slow-cooked black lentils",isVeg:true},
            {name:"Kulfi",price:70,image:"https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=200&fit=crop",desc:"Traditional Indian ice cream with pistachios",isVeg:true}
        ]},
        { id:604, name:"Tapri Central", image:"https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=120&h=120&fit=crop",
          cuisine:"Cafe • Chai • Snacks", rating:4.2, time:"10-15 min", priceRange:"₹", tag:"Trending", offer:"", isVeg:true, avgPrice:100,
          menu:[
            {name:"Tapri Special Chai",price:40,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Signature spiced tea — the star menu",isVeg:true},
            {name:"Bun Maska",price:50,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Soft bread bun with butter — classic",isVeg:true},
            {name:"Maggi (Cheese)",price:80,image:"https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop",desc:"Loaded cheese Maggi noodles",isVeg:true},
            {name:"Veg Sandwich",price:70,image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=200&fit=crop",desc:"Grilled veggie sandwich with chutney",isVeg:true},
            {name:"Cold Coffee",price:90,image:"https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop",desc:"Chilled coffee with ice cream",isVeg:true},
            {name:"Cutting Chai (2 cups)",price:30,image:"https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop",desc:"Half-glass strong tea — share & sip",isVeg:true}
        ]}
    ]
};

// ═══ CITY NORMALIZATION ═══
function normalizeCity(cityStr) {
    if (!cityStr) return "";
    const c = cityStr.toLowerCase().trim();
    if (c.includes("una") || c.includes("junagadh") || c.includes("gir somnath")) return "una";
    if (c.includes("bhiwani")) return "bhiwani";
    if (c.includes("delhi") || c.includes("new delhi")) return "new delhi";
    if (c.includes("mumbai")) return "mumbai";
    if (c.includes("ahmedabad")) return "ahmedabad";
    if (c.includes("jaipur")) return "jaipur";
    return c.split(",")[0].trim();
}

function getRestaurantsForCity(city) {
    const key = normalizeCity(city);
    return CITY_RESTAURANTS[key] || [];
}

// ═══ CART PERSISTENCE ═══
function getCartKey() { return currentUser?.email ? `quickbite-cart-${currentUser.email}` : null; }
function saveCart() { const k = getCartKey(); if (k) localStorage.setItem(k, JSON.stringify(cart)); }
function restoreCart() {
    const k = getCartKey(); if (!k) { cart = []; updateCartUI(); return; }
    try { const s = localStorage.getItem(k); cart = s ? JSON.parse(s) : []; } catch(_) { cart = []; }
    updateCartUI();
}

// ═══ NAVIGATION ═══
function goToStep(step) {
    document.querySelectorAll(".step-view").forEach(v => v.classList.remove("active"));
    document.getElementById(`step-${step}`).classList.add("active");
    const bar = document.getElementById("cart-bar");
    if ((step === "menu" || step === "restaurants") && cart.length > 0) bar.classList.add("visible");
    else bar.classList.remove("visible");
    if (step === "checkout") prepareCheckout();
    if (step === "restaurants") renderRestaurants();
    if (step === "menu" && selectedRestaurant) renderFoodGrid();
}
function switchTab(tab) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    const tabId = tab === "history" ? "history" : tab === "admin" ? "admin" : "order";
    document.getElementById(`tab-${tabId}`).classList.add("active");
    document.getElementById(`panel-${tabId}`).classList.add("active");
    if (tab === "history") loadOrderHistory();
    if (tab === "admin") renderAdminDashboard();
}

// ═══ SEARCH & FILTERS ═══
function handleSearch(v) { currentSearchTerm = v.toLowerCase().trim(); document.getElementById("search-clear").classList.toggle("visible", currentSearchTerm.length > 0); renderRestaurants(); }
function clearSearch() { currentSearchTerm = ""; document.getElementById("search-input").value = ""; document.getElementById("search-clear").classList.remove("visible"); renderRestaurants(); }
function handleMenuSearch(v) { menuSearchTerm = v.toLowerCase().trim(); document.getElementById("menu-search-clear").classList.toggle("visible", menuSearchTerm.length > 0); renderFoodGrid(); }
function clearMenuSearch() { menuSearchTerm = ""; document.getElementById("menu-search-input").value = ""; document.getElementById("menu-search-clear").classList.remove("visible"); renderFoodGrid(); }

function toggleFilter(btn) {
    const f = btn.dataset.filter, v = btn.dataset.value;
    if (activeFilters[f] === v) { activeFilters[f] = null; btn.classList.remove("active"); }
    else { document.querySelectorAll(`.filter-pill[data-filter="${f}"]`).forEach(p => p.classList.remove("active")); activeFilters[f] = v; btn.classList.add("active"); }
    renderRestaurants();
}

function getFilteredRestaurants() {
    let r = [...getRestaurantsForCity(currentCity)];
    if (currentSearchTerm) r = r.filter(x => x.name.toLowerCase().includes(currentSearchTerm) || x.cuisine.toLowerCase().includes(currentSearchTerm) || x.menu.some(m => m.name.toLowerCase().includes(currentSearchTerm)));
    if (activeFilters.rating) r = r.filter(x => x.rating >= parseFloat(activeFilters.rating));
    if (activeFilters.offer) r = r.filter(x => x.offer);
    if (activeFilters.type === "veg") r = r.filter(x => x.isVeg);
    if (activeFilters.type === "nonveg") r = r.filter(x => !x.isVeg);
    if (activeFilters.sort === "price-low") r.sort((a,b) => a.avgPrice - b.avgPrice);
    if (activeFilters.sort === "price-high") r.sort((a,b) => b.avgPrice - a.avgPrice);
    return r;
}

// ═══ RENDER RESTAURANTS ═══
function renderRestaurants() {
    const grid = document.getElementById("restaurant-grid");
    const noRes = document.getElementById("no-results");
    const list = getFilteredRestaurants();
    if (list.length === 0) { grid.innerHTML = ""; noRes.style.display = "block"; return; }
    noRes.style.display = "none";
    grid.innerHTML = list.map(r => `
        <div class="restaurant-card" onclick="selectRestaurant(${r.id})">
            ${r.tag ? `<div class="rest-tag">${r.tag}</div>` : ""}
            <div class="rest-header">
                <img class="rest-img" src="${r.image}" alt="${r.name}" onerror="this.src='${FALLBACK_IMG}'">
                <div>
                    <div class="rest-name">${r.name}</div>
                    <div class="rest-cuisine">${r.cuisine}</div>
                </div>
            </div>
            <div class="rest-meta">
                <span class="rest-rating">⭐ ${r.rating}</span>
                <span class="rest-time">🕐 ${r.time}</span>
                <span class="rest-price">${r.priceRange}</span>
                <span class="rest-veg-badge ${r.isVeg ? 'veg' : 'nonveg'}">${r.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
            </div>
            ${r.offer ? `<div class="rest-offer">🏷️ ${r.offer}</div>` : ""}
        </div>
    `).join("");
}

function selectRestaurant(id) {
    const all = getRestaurantsForCity(currentCity);
    selectedRestaurant = all.find(r => r.id === id);
    if (!selectedRestaurant) return;
    goToStep("menu");
}

// ═══ RENDER FOOD GRID ═══
function renderFoodGrid() {
    if (!selectedRestaurant) return;
    // Restaurant info header
    document.getElementById("menu-rest-info").innerHTML = `
        <img class="rest-img" src="${selectedRestaurant.image}" alt="${selectedRestaurant.name}" onerror="this.src='${FALLBACK_IMG}'">
        <div>
            <div class="rest-name" style="font-size:1.1rem">${selectedRestaurant.name}</div>
            <div class="rest-cuisine">${selectedRestaurant.cuisine}</div>
            <div class="rest-meta" style="margin-top:6px">
                <span class="rest-rating">⭐ ${selectedRestaurant.rating}</span>
                <span class="rest-time">🕐 ${selectedRestaurant.time}</span>
            </div>
        </div>`;
    // Menu items
    let items = selectedRestaurant.menu || [];
    if (menuSearchTerm) {
        items = items.filter(m => m.name.toLowerCase().includes(menuSearchTerm) || (m.desc || "").toLowerCase().includes(menuSearchTerm));
    }
    const grid = document.getElementById("food-grid");
    grid.innerHTML = items.map((m) => {
        const inCart = cart.find(c => c.name === m.name && c.restId === selectedRestaurant.id);
        const qty = inCart ? inCart.qty : 0;
        const safeImg = (m.image || FALLBACK_IMG).replace(/'/g, "\\'");
        const safeName = m.name.replace(/'/g, "\\'");
        const safeRestName = selectedRestaurant.name.replace(/'/g, "\\'");
        return `
        <div class="food-card ${qty > 0 ? 'in-cart' : ''}">
            <div class="food-veg-tag ${m.isVeg ? 'veg' : 'nonveg'}"></div>
            <img class="food-img" src="${m.image || FALLBACK_IMG}" alt="${m.name}" onerror="this.src='${FALLBACK_IMG}'" loading="lazy">
            <div class="food-info">
                <div class="food-name">${m.name}</div>
                <div class="food-desc">${m.desc || ''}</div>
                <div class="food-bottom">
                    <div class="food-price">&#8377;${m.price}</div>
                    ${qty > 0
                        ? `<div class="qty-stepper">
                             <button class="qty-btn" onclick="event.stopPropagation();changeQty('${safeName}',${selectedRestaurant.id},-1)">&#8722;</button>
                             <span class="qty-value">${qty}</span>
                             <button class="qty-btn" onclick="event.stopPropagation();changeQty('${safeName}',${selectedRestaurant.id},1)">+</button>
                           </div>`
                        : `<button class="food-add-btn" onclick="event.stopPropagation();addToCart('${safeName}',${m.price},'${safeImg}',${m.isVeg},${selectedRestaurant.id},'${safeRestName}')">ADD</button>`
                    }
                </div>
            </div>
        </div>`;
    }).join("");

}

// ═══ CART OPERATIONS ═══
function addToCart(name, price, image, isVeg, restId, restName) {
    const existing = cart.find(c => c.name === name && c.restId === restId);
    if (existing) { existing.qty++; }
    else { cart.push({ name, price, image, isVeg, restId, restName, qty: 1 }); }
    saveCart(); updateCartUI(); renderFoodGrid();
    showToast(`✅ ${name} added to cart`, "success");
}

function removeFromCart(name, restId) {
    cart = cart.filter(c => !(c.name === name && c.restId === restId));
    saveCart(); updateCartUI(); renderFoodGrid(); renderCartDrawer();
    showToast(`🗑️ Item removed`, "info");
}

function changeQty(name, restId, delta) {
    const item = cart.find(c => c.name === name && c.restId === restId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) { removeFromCart(name, restId); return; }
    saveCart(); updateCartUI(); renderFoodGrid(); renderCartDrawer();
}

function clearCart() {
    cart = [];
    saveCart(); updateCartUI(); renderFoodGrid(); renderCartDrawer();
    showToast("🗑️ Cart cleared", "info");
}

function updateCartUI() {
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById("cart-bar-count").textContent = count;
    document.getElementById("cart-bar-total").textContent = `₹${total}`;
    // Header cart badge
    const badge = document.getElementById("nav-cart-badge");
    if (badge) {
        badge.textContent = count;
        badge.classList.toggle("visible", count > 0);
    }
    // Sticky bottom cart bar — only show when on menu/restaurants step AND cart has items
    const bar = document.getElementById("cart-bar");
    const step = document.querySelector(".step-view.active");
    const stepId = step ? step.id : "";
    if (count > 0 && (stepId === "step-menu" || stepId === "step-restaurants")) {
        bar.classList.add("visible");
    } else {
        bar.classList.remove("visible");
    }
    // Update footer based on cart state
    updateFooter(count);
}

// ═══ FOOTER STATE ═══
function updateFooter(cartCount) {
    const awsBar = document.getElementById("footer-aws-bar");
    if (!awsBar) return;
    if (cartCount > 0) {
        awsBar.classList.add("visible");
    } else {
        awsBar.classList.remove("visible");
    }
}

// ═══ CART DRAWER ═══
function openCartDrawer() {
    // Drawer should only open when cart has items
    if (cart.length === 0) return;
    renderCartDrawer();
    // Scroll to top first so the footer is never visible behind the overlay
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Lock page scroll while drawer is open
    document.body.classList.add("cart-open");
    document.getElementById("cart-overlay").classList.add("visible");
    document.getElementById("cart-drawer").classList.add("visible");
}

function closeCartDrawer() {
    document.getElementById("cart-overlay").classList.remove("visible");
    document.getElementById("cart-drawer").classList.remove("visible");
    // Restore page scroll
    document.body.classList.remove("cart-open");
}

function renderCartDrawer() {
    const body = document.getElementById("cart-drawer-body");
    if (cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add items from a restaurant to get started</p>
            </div>`;
        return;
    }
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    body.innerHTML = cart.map(c => `
        <div class="cart-drawer-item">
            <img class="cart-drawer-item-img" src="${c.image}" alt="${c.name}" onerror="this.src='${FALLBACK_IMG}'">
            <div class="cart-drawer-item-info">
                <div class="cart-drawer-item-name">${c.name}</div>
                <div class="cart-drawer-item-rest">${c.restName}</div>
                <div class="qty-stepper" style="margin-top:6px;display:inline-flex">
                    <button class="qty-btn" onclick="changeQty('${c.name.replace(/'/g,"\\'")}',${c.restId},-1)">−</button>
                    <span class="qty-value">${c.qty}</span>
                    <button class="qty-btn" onclick="changeQty('${c.name.replace(/'/g,"\\'")}',${c.restId},1)">+</button>
                </div>
            </div>
            <div class="cart-drawer-item-right">
                <div class="cart-drawer-item-price">₹${c.price * c.qty}</div>
                <button class="cart-drawer-item-remove" onclick="removeFromCart('${c.name.replace(/'/g,"\\'")}',${c.restId})">✕ Remove</button>
            </div>
        </div>
    `).join("") + `
        <div class="cart-drawer-footer">
            <div class="cart-drawer-total">
                <span>Total</span>
                <span class="cdt-price">₹${total}</span>
            </div>
            <div class="cart-drawer-actions">
                <button class="btn-clear-cart" onclick="clearCart()">🗑️ Clear Cart</button>
                <button class="btn" style="flex:1" onclick="closeCartDrawer();goToStep('checkout')">Proceed to Checkout →</button>
            </div>
        </div>`;
}

// ═══ CHECKOUT ═══
function prepareCheckout() {
    if (cart.length === 0) { goToStep("menu"); showToast("Cart is empty!", "error"); return; }
    // Autofill user info
    if (currentUser) {
        const nameIn = document.getElementById("customerName");
        const emailIn = document.getElementById("customerEmail");
        if (currentUser.name) { nameIn.value = currentUser.name; document.getElementById("name-tag").style.display = "inline-flex"; nameIn.classList.add("autofilled"); }
        if (currentUser.email) { emailIn.value = currentUser.email; document.getElementById("email-tag").style.display = "inline-flex"; emailIn.classList.add("autofilled"); }
    }
    // Autofill city, state, pincode from location detection
    if (userLocation.city) {
        const cityIn = document.getElementById("customerCity");
        const stateIn = document.getElementById("customerState");
        if (cityIn) { cityIn.value = userLocation.city; }
        if (stateIn) { stateIn.value = userLocation.state; }
    }
    if (userLocation.pincode) {
        document.getElementById("customerPincode").value = userLocation.pincode;
        document.getElementById("pincode-tag").style.display = "inline-flex";
    }
    document.getElementById("card-welcome").innerHTML = `Hi <strong>${currentUser?.name || 'there'}</strong>, review your order below.`;
    // Build checkout summary
    const summary = document.getElementById("checkout-summary");
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    summary.innerHTML = cart.map(c => `
        <div class="checkout-item">
            <div><span class="ci-name">${c.name}</span> <span class="ci-qty">× ${c.qty}</span></div>
            <span class="ci-price">₹${c.price * c.qty}</span>
        </div>
    `).join("") + `
        <div class="checkout-item" style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px">
            <span class="ci-name">Grand Total</span>
            <span class="ci-price" style="font-size:1.1rem">₹${total}</span>
        </div>`;
    // Set hidden item field (for legacy lambda compatibility)
    document.getElementById("item").value = cart.map(c => `${c.name} x${c.qty}`).join(", ");
    // Make sure form and result divs are in right state
    document.getElementById("order-form").style.display = "block";
    hide(document.getElementById("success")); hide(document.getElementById("error"));
    // Initialize Leaflet map
    setTimeout(() => initCheckoutMap(), 300);
}

// ═══ LEAFLET MAP FOR CHECKOUT ═══
function initCheckoutMap() {
    const mapEl = document.getElementById("checkout-map");
    if (!mapEl) return;
    const lat = userLocation.lat || 20.5937;
    const lng = userLocation.lng || 78.9629;
    const zoom = userLocation.lat ? 15 : 5;

    if (leafletMap) { leafletMap.remove(); leafletMap = null; }

    leafletMap = L.map("checkout-map").setView([lat, lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(leafletMap);

    leafletMarker = L.marker([lat, lng], { draggable: true }).addTo(leafletMap);
    leafletMarker.bindPopup("📍 Drag to adjust delivery location").openPopup();

    leafletMarker.on("dragend", async function () {
        const pos = leafletMarker.getLatLng();
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json&addressdetails=1`);
            const data = await resp.json();
            if (data?.address) {
                const addr = data.address;
                const streetEl = document.getElementById("customerStreet");
                const areaEl = document.getElementById("customerArea");
                if (streetEl && addr.road) streetEl.value = addr.road;
                if (areaEl) areaEl.value = [addr.neighbourhood, addr.suburb].filter(Boolean).join(", ") || addr.city || "";
                if (addr.postcode) document.getElementById("customerPincode").value = addr.postcode;
                showToast("📍 Address updated from map pin", "success");
            }
        } catch (_) {}
    });

    // Force map to resize properly
    setTimeout(() => leafletMap.invalidateSize(), 100);
}

// ═══ DETECT LOCATION (checkout button) ═══
function detectLocation() {
    if (!navigator.geolocation) { showToast("Geolocation not supported", "error"); return; }
    showToast("📍 Detecting your location…", "info");
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
                const data = await resp.json();
                if (data?.address) {
                    const addr = data.address;
                    const houseEl = document.getElementById("customerHouse");
                    const streetEl = document.getElementById("customerStreet");
                    const areaEl = document.getElementById("customerArea");
                    if (streetEl && addr.road) streetEl.value = addr.road;
                    if (areaEl) areaEl.value = [addr.neighbourhood, addr.suburb].filter(Boolean).join(", ") || "";
                    if (addr.postcode) {
                        document.getElementById("customerPincode").value = addr.postcode;
                        document.getElementById("pincode-tag").style.display = "inline-flex";
                    }
                    // Update map marker
                    if (leafletMap && leafletMarker) {
                        leafletMarker.setLatLng([latitude, longitude]);
                        leafletMap.setView([latitude, longitude], 16);
                    }
                    showToast("✅ Location detected!", "success");
                }
            } catch (_) { showToast("Could not detect address", "error"); }
        },
        () => showToast("Location access denied", "error"),
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ═══ ORDER SUBMISSION (now triggers payment modal) ═══
async function handleOrderSubmit(e) {
    if (e) e.preventDefault();

    try {
        const nameEl = document.getElementById("customerName") || {};
        const emailEl = document.getElementById("customerEmail") || {};
        const phoneEl = document.getElementById("customerPhone") || {};
        const houseEl = document.getElementById("customerHouse") || {};
        const streetEl = document.getElementById("customerStreet") || {};
        const areaEl = document.getElementById("customerArea") || {};
        const landmarkEl = document.getElementById("customerLandmark") || {};
        const cityEl = document.getElementById("customerCity") || {};
        const stateEl = document.getElementById("customerState") || {};
        const pinEl = document.getElementById("customerPincode") || {};
        const noteEl = document.getElementById("customerDeliveryNote") || {};

        const name = (nameEl.value || "").trim();
        const email = (emailEl.value || "").trim();
        const phone = (phoneEl.value || "").trim();
        const houseNo = (houseEl.value || "").trim();
        const street = (streetEl.value || "").trim();
        const area = (areaEl.value || "").trim();
        const landmark = (landmarkEl.value || "").trim();
        const city = (cityEl.value || "").trim();
        const state = (stateEl.value || "").trim();
        const pincode = (pinEl.value || "").trim();
        const deliveryNote = (noteEl.value || "").trim();

        const fullAddress = [houseNo, street, area, landmark, city, state, pincode].filter(Boolean).join(", ");

        // Check for city mismatch
        const normalizedDeliveryCity = normalizeCity(city);
        if (normalizedDeliveryCity && normalizedDeliveryCity !== currentCity && currentCity !== "") {
            const proceed = window.confirm(`⚠️ Location Mismatch!\n\nYou selected restaurants from ${currentCity.toUpperCase()}, but your delivery address city is ${city.toUpperCase()}.\n\nAre you sure you want to place this order? QuickBite might not deliver cross-city.`);
            if (!proceed) return false;
        }

        // Store order payload for after payment
        window._pendingOrderPayload = {
            customerName: name,
            customerEmail: email,
            customerPhone: "+91" + phone,
            item: document.getElementById("item") ? document.getElementById("item").value : "",
            address: fullAddress,
            deliveryAddress: { houseNo, street, area, landmark, city, state, pincode, deliveryNote },
            deliveryCity: currentCity,
            cart: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty, restaurantId: String(c.restId), restaurantName: c.restName })),
            email: email
        };

        // Open payment modal instead of directly placing order
        openPaymentModal();
    } catch (err) {
        console.error("Order submit failed:", err);
        showToast("Error processing order details. Please check all fields.", "error");
    }
    return false;
}

// Actually place the order after payment success
async function placeOrderAfterPayment(paymentMethod) {
    const orderPayload = window._pendingOrderPayload;
    if (!orderPayload) return;

    orderPayload.paymentMethod = paymentMethod;
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    orderPayload.totalAmount = total;

    let orderId;
    try {
        const resp = await fetch(`${API_URL}/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Order failed");
        orderId = data.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;
    } catch (err) {
        console.error("Order API error (using demo mode):", err);
        orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    }

    // Save order to local storage for tracking & admin
    saveOrderLocally(orderId, orderPayload, paymentMethod, total);

    document.getElementById("order-id").textContent = orderId;
    document.getElementById("order-form").style.display = "none";
    show(document.getElementById("success"));
    showToast(`🎉 Order ${orderId} placed successfully!`, "success");

    // Send mock email notification
    sendMockEmail(orderId, orderPayload, total);

    // Start order tracking
    startOrderTracking(orderId);

    const key = getCartKey();
    if (key) localStorage.removeItem(key);
    cart = [];
    updateCartUI();
    window._pendingOrderPayload = null;
}

function resetForm() {
    document.getElementById("order-form").reset();
    document.getElementById("order-form").style.display = "block";
    hide(document.getElementById("success")); hide(document.getElementById("error"));
    document.querySelectorAll(".autofill-tag").forEach(t => t.style.display = "none");
    document.querySelectorAll(".autofilled").forEach(i => i.classList.remove("autofilled"));
    goToStep("restaurants");
}

// ═══ ORDER HISTORY (Enhanced with tracking buttons) ═══
async function loadOrderHistory() {
    if (!currentUser?.email) return;
    const loading = document.getElementById("orders-loading");
    const empty = document.getElementById("orders-empty");
    const list = document.getElementById("order-list");
    loading.style.display = "flex"; empty.style.display = "none"; list.style.display = "none";

    // Merge API orders with local orders
    let allOrders = [];

    // Try API first
    try {
        const resp = await fetch(`${API_URL}/orders?email=${encodeURIComponent(currentUser.email)}`);
        const data = await resp.json();
        if (data.orders && data.orders.length > 0) {
            allOrders = data.orders;
        }
    } catch (err) { console.error("API orders failed, using local:", err); }

    // Merge local orders
    const localOrders = getLocalOrders();
    const apiIds = new Set(allOrders.map(o => o.orderId));
    for (const lo of localOrders) {
        if (!apiIds.has(lo.orderId)) allOrders.push(lo);
    }

    // Sort by timestamp desc
    allOrders.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    loading.style.display = "none";

    if (allOrders.length === 0) {
        empty.style.display = "block"; list.style.display = "none";
        const badge = document.getElementById("orders-count");
        badge.textContent = "0"; badge.style.display = "none";
        return;
    }

    const badge = document.getElementById("orders-count");
    badge.textContent = allOrders.length; badge.style.display = "inline-flex";

    const STATUS_ICONS = { PLACED: '📦', CONFIRMED: '✅', PREPARING: '👨‍🍳', OUT_FOR_DELIVERY: '🛵', DELIVERED: '🎉', FAILED: '❌' };
    const STATUS_COLORS = { PLACED: 'placed', CONFIRMED: 'confirmed', PREPARING: 'preparing', OUT_FOR_DELIVERY: 'out-for-delivery', DELIVERED: 'delivered', FAILED: 'failed' };

    list.innerHTML = allOrders.map(o => {
        const status = o.status || 'PLACED';
        const statusIcon = STATUS_ICONS[status] || '📦';
        const statusClass = STATUS_COLORS[status] || 'placed';
        const total = o.totalAmount ? `₹${o.totalAmount}` : '';
        const payMethod = o.paymentMethod ? `💳 ${o.paymentMethod.toUpperCase()}` : '';
        return `
            <div class="order-item">
                <div class="order-item-left">
                    <div class="order-item-icon">${statusIcon}</div>
                    <div>
                        <div class="order-item-name">${o.item || 'Order'}</div>
                        <div class="order-item-meta">${o.timestamp ? new Date(o.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Recent'}${payMethod ? ' • ' + payMethod : ''}${total ? ' • ' + total : ''}</div>
                    </div>
                </div>
                <div class="order-item-right">
                    <div class="order-item-id">${o.orderId || ''}</div>
                    <div class="admin-order-status ${statusClass}">${status.replace(/_/g, ' ')}</div>
                    <div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end">
                        <button class="admin-action-btn track" onclick="openTrackingModal('${o.orderId}')">📍 Track</button>
                        <button class="admin-action-btn" onclick="showEmailPreview('${o.orderId}')">📧 Email</button>
                        ${status === 'FAILED' ? `<button class="admin-action-btn" onclick="retryFailedOrder('${o.orderId}')" style="color:var(--error)">🔄 Retry</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join("");
    list.style.display = "flex";
    ordersLoaded = true;
}


// ═══ TOAST NOTIFICATIONS ═══
function showToast(msg, type = "info") {
    const container = document.getElementById("toast-container");
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══ AWS SERVICE DATA (Enhanced for Modal) ═══
const SERVICE_INFO = {
    s3: { icon: '<i data-lucide="hard-drive" style="width:22px;height:22px;"></i>', name: "Amazon S3", desc: "Simple Storage Service — scalable object storage for any type of data. Designed for 99.999999999% durability.", usage: "Hosts the entire QuickBite frontend as a static website. All HTML, CSS, and JavaScript files are stored in an S3 bucket configured for web hosting.", flow: ["Build Frontend", "Upload to S3", "Enable Static Hosting", "CloudFront CDN"] },
    cloudfront: { icon: '<i data-lucide="globe" style="width:22px;height:22px;"></i>', name: "CloudFront", desc: "Global Content Delivery Network — caches and serves content from 400+ edge locations worldwide with ultra-low latency.", usage: "Distributes the QuickBite website globally. When you load this page, CloudFront serves it from the nearest edge location for blazing-fast load times.", flow: ["User Request", "Edge Location", "Cache Check", "Serve Content"] },
    "api-gateway": { icon: '<i data-lucide="door-open" style="width:22px;height:22px;"></i>', name: "API Gateway", desc: "Fully managed API service — creates, publishes, and secures REST APIs at any scale. Handles throttling, CORS, and auth.", usage: "Exposes two endpoints: POST /order (place new order) and GET /orders (fetch order history). Routes all requests to Lambda functions.", flow: ["HTTP Request", "API Gateway", "Route to Lambda", "Return Response"] },
    lambda: { icon: '<i data-lucide="code" style="width:22px;height:22px;"></i>', name: "AWS Lambda", desc: "Serverless compute — runs code in response to events without provisioning servers. Pay only for compute time used.", usage: "Two Lambda functions power QuickBite: OrderHandler (validates and saves orders to DynamoDB, pushes to SQS) and OrderProcessor (reads SQS, sends emails via SES/SNS).", flow: ["API Trigger", "OrderHandler λ", "Save to DynamoDB", "Push to SQS", "OrderProcessor λ"] },
    dynamodb: { icon: '<i data-lucide="database" style="width:22px;height:22px;"></i>', name: "DynamoDB", desc: "NoSQL database — single-digit millisecond performance at any scale. Fully managed with built-in security and backup.", usage: "Stores all order records with partition key (orderId) and a Global Secondary Index (GSI) on email for fast order history queries.", flow: ["Lambda Writes", "DynamoDB Table", "GSI on Email", "Query Orders"] },
    sqs: { icon: '<i data-lucide="mail-plus" style="width:22px;height:22px;"></i>', name: "Amazon SQS", desc: "Simple Queue Service — fully managed message queuing. Decouples and scales microservices, distributed systems.", usage: "Decouples order placement from notification processing. When an order is placed, it's queued in SQS. A separate Lambda polls the queue to send emails asynchronously.", flow: ["Order Placed", "Message to SQS", "Lambda Polls", "Process Async"] },
    ses: { icon: '<i data-lucide="mail" style="width:22px;height:22px;"></i>', name: "Amazon SES", desc: "Simple Email Service — reliable, scalable email sending. Supports HTML templates and high deliverability.", usage: "Sends professional HTML receipt emails to customers after order placement. Includes order details, item breakdown, and delivery address.", flow: ["Order Processed", "Build HTML Email", "SES Sends", "Customer Inbox"] },
    sns: { icon: '<i data-lucide="bell" style="width:22px;height:22px;"></i>', name: "Amazon SNS", desc: "Simple Notification Service — pub/sub messaging for microservices, distributed systems, and serverless apps.", usage: "Notifies the restaurant owner instantly when a new order arrives. Sends alerts via email and can be extended to SMS notifications.", flow: ["New Order", "SNS Topic", "Push Notification", "Owner Alerted"] },
    cloudwatch: { icon: '<i data-lucide="activity" style="width:22px;height:22px;"></i>', name: "CloudWatch", desc: "Monitoring and observability — collects metrics, logs, and events from all AWS resources in real time.", usage: "Monitors all Lambda invocations, tracks API Gateway request counts, latency, and error rates. Enables debugging and performance optimization.", flow: ["Lambda Logs", "API Metrics", "Dashboard", "Alerts"] },
};

// ═══ SERVICE MODAL ═══
function openServiceModal(serviceKey) {
    const info = SERVICE_INFO[serviceKey];
    if (!info) return;
    document.getElementById("smodal-icon").innerHTML = info.icon;
    document.getElementById("smodal-title").textContent = info.name;
    document.getElementById("smodal-desc").textContent = info.desc;
    document.getElementById("smodal-usage").textContent = info.usage;
    // Build flow steps
    const flowEl = document.getElementById("smodal-flow");
    if (info.flow && info.flow.length) {
        flowEl.innerHTML = info.flow.map((step, i) =>
            `<span class="service-modal-flow-step">${step}</span>${i < info.flow.length - 1 ? '<span class="service-modal-flow-arrow">→</span>' : ''}`
        ).join("");
    } else { flowEl.innerHTML = ""; }
    // Highlight active card
    document.querySelectorAll(".aws-service-card").forEach(c => c.classList.remove("active"));
    const activeCard = document.querySelector(`.aws-service-card[data-service="${serviceKey}"]`);
    if (activeCard) activeCard.classList.add("active");
    document.getElementById("service-modal-overlay").classList.add("visible");
    document.getElementById("service-modal").classList.add("visible");
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeServiceModal() {
    document.getElementById("service-modal-overlay").classList.remove("visible");
    document.getElementById("service-modal").classList.remove("visible");
    document.querySelectorAll(".aws-service-card").forEach(c => c.classList.remove("active"));
}

// ═══ TOOLTIPS ═══
function showTooltip(el) {
    const key = el.dataset.service;
    const info = SERVICE_INFO[key];
    if (!info) return;
    const container = document.getElementById("tooltip-container");
    document.getElementById("tooltip-icon").innerHTML = info.icon;
    document.getElementById("tooltip-name").textContent = info.name;
    document.getElementById("tooltip-desc").textContent = info.desc;
    document.getElementById("tooltip-usage").textContent = info.usage;
    container.style.display = "block";
    const rect = el.getBoundingClientRect();
    const arrow = document.getElementById("tooltip-arrow");
    container.style.left = `${Math.max(8, rect.left + rect.width / 2 - 160)}px`;
    container.style.top = `${rect.bottom + 14}px`;
    arrow.style.top = "-8px";
    arrow.style.left = "50%";
    arrow.style.transform = "translateX(-50%) rotate(225deg)";
    requestAnimationFrame(() => { container.classList.add("visible"); if (typeof lucide !== 'undefined') lucide.createIcons(); });
}

function hideTooltip() {
    const container = document.getElementById("tooltip-container");
    container.classList.remove("visible");
    setTimeout(() => { if (!container.classList.contains("visible")) container.style.display = "none"; }, 250);
}

// ═══ ANIMATED PIPELINE — Step-based AWS Storytelling ═══
const PIPELINE_STEPS = [
    { icon: '<i data-lucide="shield-check" style="width:24px;height:24px;"></i>', name: "Sign In", aws: "Amazon Cognito", awsShort: "Cognito", detail: "User authenticates via AWS Cognito (Google OAuth or email/password). Session is created and stored securely.", awsLabel: "Using Amazon Cognito for authentication" },
    { icon: '<i data-lucide="send" style="width:24px;height:24px;"></i>', name: "Submit", aws: "API Gateway", awsShort: "API GW", detail: "Order data is sent via HTTPS POST to API Gateway, which validates the request, handles CORS, and routes to Lambda.", awsLabel: "Handled by API Gateway" },
    { icon: '<i data-lucide="code" style="width:24px;height:24px;"></i>', name: "Handler", aws: "Lambda + DynamoDB", awsShort: "Lambda", detail: "OrderHandler Lambda validates the payload, generates a unique orderId, writes to DynamoDB, and enqueues to SQS.", awsLabel: "Processed by AWS Lambda & stored in DynamoDB" },
    { icon: '<i data-lucide="mail-plus" style="width:24px;height:24px;"></i>', name: "Queue", aws: "Amazon SQS", awsShort: "SQS", detail: "Order message sits in SQS queue. A separate OrderProcessor Lambda polls the queue asynchronously — fully decoupled.", awsLabel: "Order placed in SQS for async processing" },
    { icon: '<i data-lucide="bell" style="width:24px;height:24px;"></i>', name: "Notify", aws: "Amazon SNS", awsShort: "SNS", detail: "OrderProcessor sends owner notification via SNS, then crafts a professional HTML receipt and sends it to customer via SES.", awsLabel: "SNS triggers notification to restaurant" },
    { icon: '<i data-lucide="mail" style="width:24px;height:24px;"></i>', name: "Email", aws: "Amazon SES", awsShort: "SES", detail: "Customer receives a beautifully formatted HTML email with order summary, delivery address, and order ID for tracking.", awsLabel: "SES sends confirmation email to you" }
];

let pipelineAutoInterval = null;
let activePipelineStep = -1;
let pipelineSequenceRunning = false;

function renderPipeline() {
    const container = document.getElementById("pipeline-container");
    if (!container) return;
    let html = "";
    PIPELINE_STEPS.forEach((step, i) => {
        html += `<div class="pipeline-step-wrapper">`;
        html += `<div class="pipeline-step" data-step="${i}" onclick="clickPipelineStep(${i})" onmouseenter="hoverPipelineStep(${i})" onmouseleave="unhoverPipelineStep()">
            <div class="pipeline-num">${i + 1}</div>
            <div class="pipeline-icon">${step.icon}</div>
            <div class="pipeline-name">${step.name}</div>
            <div class="pipeline-aws">${step.awsShort}</div>
            <div class="pipeline-float-label" id="float-label-${i}">
                <span class="float-label-icon"><i data-lucide="cloud" style="width:14px;height:14px;"></i></span>
                <span class="float-label-text">${step.awsLabel}</span>
            </div>
        </div>`;
        if (i < PIPELINE_STEPS.length - 1) {
            html += `<div class="pipeline-connector" data-conn="${i}">
                <svg width="36" height="20" viewBox="0 0 36 20"><line class="connector-line" x1="0" y1="10" x2="28" y2="10"/><polygon class="connector-arrow" points="26,5 36,10 26,15"/></svg>
            </div>`;
        }
        html += `</div>`;
    });
    container.innerHTML = html;
    // Re-initialize Lucide icons for dynamically rendered pipeline
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function clickPipelineStep(index) {
    stopPipelineAuto();
    pipelineSequenceRunning = false;
    setActivePipelineStep(index);
}

function hoverPipelineStep(index) {
    stopPipelineAuto();
    pipelineSequenceRunning = false;
    setActivePipelineStep(index);
}

function unhoverPipelineStep() {
    setTimeout(() => startPipelineSequence(), 3000);
}

function setActivePipelineStep(index) {
    activePipelineStep = index;
    const steps = document.querySelectorAll(".pipeline-step");
    const connectors = document.querySelectorAll(".pipeline-connector");
    steps.forEach((s, i) => {
        s.classList.toggle("active", i === index);
        s.classList.toggle("completed", i < index);
    });
    connectors.forEach((c, i) => {
        c.classList.toggle("active", i < index);
        c.classList.toggle("animated", i < index);
    });
    // Show/hide floating labels
    PIPELINE_STEPS.forEach((_, i) => {
        const label = document.getElementById(`float-label-${i}`);
        if (label) label.classList.toggle("visible", i === index);
    });
    // Update progress bar
    const progressFill = document.getElementById("pipeline-progress-fill");
    if (progressFill) {
        const progress = ((index + 1) / PIPELINE_STEPS.length) * 100;
        progressFill.style.width = progress + "%";
    }
    // Show detail panel
    const detail = document.getElementById("pipeline-detail");
    if (detail && PIPELINE_STEPS[index]) {
        const s = PIPELINE_STEPS[index];
        detail.innerHTML = `<div class="pipeline-detail-header"><span class="pipeline-detail-icon">${s.icon}</span><span class="pipeline-detail-title">${s.name} — ${s.aws}</span></div><div class="pipeline-detail-text">${s.detail}</div><div class="pipeline-detail-badge"><span class="aws-badge"><i data-lucide="cloud" style="width:12px;height:12px;display:inline;vertical-align:-2px;margin-right:3px;"></i> ${s.aws}</span></div>`;
        detail.classList.add("visible");
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Sequential storytelling — steps light up one by one with delay
function startPipelineSequence() {
    if (pipelineAutoInterval || pipelineSequenceRunning) return;
    pipelineSequenceRunning = true;
    let step = 0;
    function nextStep() {
        if (!pipelineSequenceRunning) return;
        setActivePipelineStep(step);
        step++;
        if (step < PIPELINE_STEPS.length) {
            pipelineAutoInterval = setTimeout(nextStep, 1800);
        } else {
            pipelineAutoInterval = setTimeout(() => {
                step = 0;
                nextStep();
            }, 3000);
        }
    }
    nextStep();
}

function startPipelineAuto() {
    startPipelineSequence();
}

function stopPipelineAuto() {
    if (pipelineAutoInterval) { clearTimeout(pipelineAutoInterval); pipelineAutoInterval = null; }
    pipelineSequenceRunning = false;
}

// Replay pipeline animation from the start
function replayPipeline() {
    stopPipelineAuto();
    // Reset all steps
    document.querySelectorAll(".pipeline-step").forEach(s => {
        s.classList.remove("active", "completed");
        s.style.opacity = "0";
    });
    document.querySelectorAll(".pipeline-connector").forEach(c => {
        c.classList.remove("active", "animated");
    });
    PIPELINE_STEPS.forEach((_, i) => {
        const label = document.getElementById(`float-label-${i}`);
        if (label) label.classList.remove("visible");
    });
    const detail = document.getElementById("pipeline-detail");
    if (detail) { detail.classList.remove("visible"); detail.innerHTML = ""; }
    const progressFill = document.getElementById("pipeline-progress-fill");
    if (progressFill) progressFill.style.width = "0%";
    // Re-stagger entrance animations
    document.querySelectorAll(".pipeline-step").forEach((s, i) => {
        s.style.animation = `stagger-in 0.4s ease ${i * 0.12}s forwards`;
    });
    // Animate the replay button icon
    const btn = document.getElementById("pipeline-replay-btn");
    if (btn) {
        const icon = btn.querySelector(".replay-icon");
        if (icon) {
            icon.style.transition = "transform 0.5s ease";
            icon.style.transform = "rotate(-720deg)";
            setTimeout(() => { icon.style.transform = ""; }, 600);
        }
    }
    // Start sequence after stagger
    setTimeout(() => startPipelineSequence(), 800);
}

// IntersectionObserver for pipeline entrance
function initPipelineObserver() {
    const section = document.getElementById("pipeline-section");
    if (!section) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll(".pipeline-step").forEach((s, i) => {
                    s.style.opacity = "0";
                    s.style.animation = `stagger-in 0.4s ease ${i * 0.12}s forwards`;
                });
                setTimeout(() => startPipelineSequence(), 800);
                obs.unobserve(section);
            }
        });
    }, { threshold: 0.3 });
    obs.observe(section);
}

// ═══ SCROLL REVEAL ═══
function initScrollReveal() {
    // Add reveal-section class to login card and other elements
    const revealTargets = document.querySelectorAll(".login-card, .aws-services-section");
    revealTargets.forEach(el => el.classList.add("reveal-section"));

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    document.querySelectorAll(".reveal-section").forEach(el => revealObs.observe(el));

    // Fade scroll indicator on scroll
    const scrollIndicator = document.getElementById("scroll-indicator");
    if (scrollIndicator) {
        let scrollTimeout;
        window.addEventListener("scroll", () => {
            const scrollY = window.scrollY;
            scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 200);
            if (scrollY > 300) scrollIndicator.style.display = "none";
        }, { passive: true });
    }
}

// ═══ RIPPLE EFFECT ═══
function createRipple(e) {
    const el = e.currentTarget;
    const circle = document.createElement("span");
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    circle.style.width = circle.style.height = size + "px";
    circle.style.left = (e.clientX - rect.left - size / 2) + "px";
    circle.style.top = (e.clientY - rect.top - size / 2) + "px";
    circle.className = "ripple-circle";
    el.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

function initRipples() {
    document.querySelectorAll(".btn, .filter-pill, .food-add-btn, .tab-btn, .city-chip, .aws-service-card, .pipeline-replay-btn").forEach(el => {
        el.addEventListener("click", createRipple);
    });
}

// ═══ CART BADGE BOUNCE ═══
const origUpdateCartUI = updateCartUI;
updateCartUI = function() {
    const prevCount = parseInt(document.getElementById("nav-cart-badge")?.textContent || "0");
    origUpdateCartUI();
    const newCount = parseInt(document.getElementById("nav-cart-badge")?.textContent || "0");
    if (newCount > prevCount) {
        const badge = document.getElementById("nav-cart-badge");
        if (badge) {
            badge.classList.remove("bounce");
            void badge.offsetWidth; // trigger reflow
            badge.classList.add("bounce");
        }
    }
};

// ═══ INIT ENHANCEMENTS ═══
document.addEventListener("DOMContentLoaded", function() {
    // Initialize Lucide SVG icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    renderPipeline();
    initPipelineObserver();
    setTimeout(initRipples, 500);
    setTimeout(initScrollReveal, 300);
    // Close service modal on Escape
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeServiceModal();
    });
    // Set correct initial theme icon
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const themeEl = document.getElementById("theme-icon");
    if (themeEl) {
        const iconName = currentTheme === "dark" ? "moon" : "sun";
        themeEl.innerHTML = `<i data-lucide="${iconName}" style="width:16px;height:16px;"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
});

// ═══ UTILITIES ═══
function hide(el) { if (el) el.classList.remove("visible"); }
function show(el) { if (el) el.classList.add("visible"); }

// ═══════════════════════════════════════════════════════════════
// FEATURE 1: PAYMENT PROCESSING (Mock with 20% failure rate)
// ═══════════════════════════════════════════════════════════════
let selectedPaymentMethod = "card";
let paymentRetryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

function openPaymentModal() {
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById("payment-amount").textContent = `₹${total}`;
    document.getElementById("pay-btn-label").textContent = `💳 Pay ₹${total}`;
    // Reset state
    selectedPaymentMethod = "card";
    paymentRetryCount = 0;
    selectPaymentMethod("card");
    document.getElementById("payment-processing").style.display = "none";
    document.getElementById("payment-retry").style.display = "none";
    document.getElementById("pay-submit-btn").style.display = "block";
    document.getElementById("pay-submit-btn").disabled = false;
    document.getElementById("pay-submit-btn").classList.remove("is-loading");
    // Show forms
    document.getElementById("pay-form-card").style.display = "block";
    document.getElementById("pay-form-upi").style.display = "none";
    document.getElementById("pay-form-cod").style.display = "none";
    // Show modal
    document.getElementById("payment-modal-overlay").classList.add("visible");
    document.getElementById("payment-modal").classList.add("visible");
}

function closePaymentModal() {
    document.getElementById("payment-modal-overlay").classList.remove("visible");
    document.getElementById("payment-modal").classList.remove("visible");
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll(".payment-method-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.method === method);
    });
    document.getElementById("pay-form-card").style.display = method === "card" ? "block" : "none";
    document.getElementById("pay-form-upi").style.display = method === "upi" ? "block" : "none";
    document.getElementById("pay-form-cod").style.display = method === "cod" ? "block" : "none";
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const labels = { card: `💳 Pay ₹${total}`, upi: `📱 Pay ₹${total}`, cod: `💵 Confirm COD ₹${total}` };
    document.getElementById("pay-btn-label").textContent = labels[method] || labels.card;
}

function formatCardNumber(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
    input.value = v;
}

function validatePaymentForm() {
    if (selectedPaymentMethod === "card") {
        const num = document.getElementById("pay-card-number").value.replace(/\s/g, '');
        const expiry = document.getElementById("pay-card-expiry").value;
        const cvv = document.getElementById("pay-card-cvv").value;
        const name = document.getElementById("pay-card-name").value.trim();
        if (num.length < 13) { showToast("Enter a valid card number", "error"); return false; }
        if (!/^\d{2}\/\d{2}$/.test(expiry)) { showToast("Enter a valid expiry (MM/YY)", "error"); return false; }
        if (cvv.length < 3) { showToast("Enter a valid CVV", "error"); return false; }
        if (!name) { showToast("Enter cardholder name", "error"); return false; }
    } else if (selectedPaymentMethod === "upi") {
        const upi = document.getElementById("pay-upi-id").value.trim();
        if (!upi || !upi.includes("@")) { showToast("Enter a valid UPI ID", "error"); return false; }
    }
    return true;
}

async function processPayment() {
    if (!validatePaymentForm()) return;
    paymentRetryCount = 0;
    await attemptPayment();
}

async function attemptPayment() {
    const btn = document.getElementById("pay-submit-btn");
    btn.style.display = "none";

    // Hide forms, show processing
    document.querySelectorAll(".payment-form").forEach(f => f.style.display = "none");
    document.getElementById("payment-retry").style.display = "none";
    const processing = document.getElementById("payment-processing");
    processing.style.display = "block";

    // Reset steps
    document.querySelectorAll(".pp-step").forEach(s => { s.classList.remove("active", "done"); });
    document.getElementById("payment-process-text").textContent = "Processing payment...";

    // Animate processing steps
    await animateStep("pp-step-1", 800);
    await animateStep("pp-step-2", 1000);

    // 20% failure rate
    const willFail = Math.random() < 0.2;

    if (willFail && paymentRetryCount < MAX_RETRIES) {
        // Payment failed
        document.getElementById("pp-step-3").classList.add("active");
        await sleep(500);
        processing.style.display = "none";
        showPaymentRetry();
    } else {
        // Payment success
        await animateStep("pp-step-3", 600);
        document.getElementById("payment-process-text").textContent = "Payment successful! ✅";
        showToast("✅ Payment successful!", "success");
        await sleep(800);
        closePaymentModal();
        // Place the actual order
        placeOrderAfterPayment(selectedPaymentMethod);
    }
}

function animateStep(stepId, duration) {
    return new Promise(resolve => {
        const step = document.getElementById(stepId);
        // Mark previous steps as done
        const steps = document.querySelectorAll(".pp-step");
        let found = false;
        steps.forEach(s => {
            if (s.id === stepId) { found = true; s.classList.add("active"); s.classList.remove("done"); }
            else if (!found) { s.classList.remove("active"); s.classList.add("done"); }
        });
        setTimeout(resolve, duration);
    });
}

function showPaymentRetry() {
    paymentRetryCount++;
    const retry = document.getElementById("payment-retry");
    retry.style.display = "block";
    document.getElementById("retry-attempts").textContent = `Attempt ${paymentRetryCount} of ${MAX_RETRIES}`;
    document.getElementById("retry-message").textContent =
        paymentRetryCount >= MAX_RETRIES
            ? "Maximum retry attempts reached. Please try again."
            : `Transaction declined. Retrying in ${RETRY_DELAYS[paymentRetryCount - 1] / 1000}s...`;

    // Animate progress bar
    const bar = document.getElementById("retry-progress-bar");
    bar.style.width = "0%";
    bar.style.transition = "none";
    requestAnimationFrame(() => {
        bar.style.transition = `width ${RETRY_DELAYS[paymentRetryCount - 1] || 2000}ms linear`;
        bar.style.width = "100%";
    });

    if (paymentRetryCount >= MAX_RETRIES) {
        // Show manual retry button
        setTimeout(() => {
            const btn = document.getElementById("pay-submit-btn");
            btn.style.display = "block";
            document.getElementById("pay-btn-label").textContent = "🔄 Try Again";
            showToast("❌ Payment failed after 3 attempts", "error");
        }, 1500);
    } else {
        // Auto retry with exponential backoff
        showToast(`⚠️ Payment failed. Retrying (attempt ${paymentRetryCount + 1}/${MAX_RETRIES})...`, "info");
        setTimeout(() => {
            retry.style.display = "none";
            attemptPayment();
        }, RETRY_DELAYS[paymentRetryCount - 1]);
    }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
// FEATURE 2: LOCAL ORDER STORAGE
// ═══════════════════════════════════════════════════════════════
function getLocalOrdersKey() { return `quickbite-orders-${currentUser?.email || 'guest'}`; }

function getLocalOrders() {
    try { return JSON.parse(localStorage.getItem(getLocalOrdersKey()) || "[]"); }
    catch(_) { return []; }
}

function saveLocalOrders(orders) {
    localStorage.setItem(getLocalOrdersKey(), JSON.stringify(orders));
}

function saveOrderLocally(orderId, payload, paymentMethod, total) {
    const orders = getLocalOrders();
    orders.push({
        orderId,
        item: payload.item,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        address: payload.address,
        cart: payload.cart,
        paymentMethod,
        totalAmount: total,
        status: "PLACED",
        timestamp: new Date().toISOString(),
        statusHistory: [{ status: "PLACED", time: new Date().toISOString() }]
    });
    saveLocalOrders(orders);
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getLocalOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
        order.status = newStatus;
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({ status: newStatus, time: new Date().toISOString() });
        saveLocalOrders(orders);
    }
}

function getOrderById(orderId) {
    return getLocalOrders().find(o => o.orderId === orderId);
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 3: ORDER STATUS TRACKING
// ═══════════════════════════════════════════════════════════════
const ORDER_STATUSES = [
    { key: "PLACED", icon: "📦", title: "Order Placed", desc: "Your order has been received" },
    { key: "CONFIRMED", icon: "✅", title: "Confirmed", desc: "Restaurant has accepted your order" },
    { key: "PREPARING", icon: "👨‍🍳", title: "Preparing", desc: "Your food is being prepared" },
    { key: "OUT_FOR_DELIVERY", icon: "🛵", title: "Out for Delivery", desc: "Your rider is on the way" },
    { key: "DELIVERED", icon: "🎉", title: "Delivered", desc: "Enjoy your meal!" }
];

let trackingTimers = {};

function startOrderTracking(orderId) {
    // Auto-advance status every 15-30 seconds
    let currentIdx = 0;
    function advanceStatus() {
        currentIdx++;
        if (currentIdx >= ORDER_STATUSES.length) {
            clearInterval(trackingTimers[orderId]);
            delete trackingTimers[orderId];
            return;
        }
        const newStatus = ORDER_STATUSES[currentIdx].key;
        updateOrderStatus(orderId, newStatus);

        // Show toast for status update
        const statusInfo = ORDER_STATUSES[currentIdx];
        showToast(`${statusInfo.icon} Order ${orderId}: ${statusInfo.title}`, "info");

        // Send email notification for status change
        sendStatusEmail(orderId, newStatus);
    }
    const delay = 15000 + Math.random() * 15000; // 15-30 seconds
    trackingTimers[orderId] = setInterval(advanceStatus, delay);
}

function openTrackingModal(orderId) {
    const order = getOrderById(orderId);
    document.getElementById("tracking-order-id").textContent = orderId;

    if (!order) {
        document.getElementById("tracking-timeline").innerHTML = `<p style="color:var(--text-3)">Order not found in local storage.</p>`;
        document.getElementById("tracking-details").innerHTML = "";
        document.getElementById("tracking-eta").textContent = "";
    } else {
        const currentStatus = order.status || "PLACED";
        const currentIdx = ORDER_STATUSES.findIndex(s => s.key === currentStatus);
        const isDelivered = currentStatus === "DELIVERED";

        document.getElementById("tracking-eta").textContent = isDelivered ? "✅ Delivered" : "Estimated: 25-40 min";

        document.getElementById("tracking-timeline").innerHTML = ORDER_STATUSES.map((s, i) => {
            let cls = "";
            if (i < currentIdx) cls = "completed";
            else if (i === currentIdx) cls = "active";
            const histEntry = (order.statusHistory || []).find(h => h.status === s.key);
            const timeStr = histEntry ? new Date(histEntry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : "";
            return `
                <div class="tracking-step ${cls}" style="animation-delay:${i * 0.1}s">
                    <div class="tracking-step-dot"></div>
                    <div class="tracking-step-title">${s.icon} ${s.title}</div>
                    ${timeStr ? `<div class="tracking-step-time">${timeStr}</div>` : ''}
                    <div class="tracking-step-desc">${s.desc}</div>
                </div>`;
        }).join("");

        document.getElementById("tracking-details").innerHTML = `
            <div class="tracking-detail-row">
                <span class="tracking-detail-label">Items</span>
                <span class="tracking-detail-value">${order.item || 'N/A'}</span>
            </div>
            <div class="tracking-detail-row">
                <span class="tracking-detail-label">Total</span>
                <span class="tracking-detail-value" style="color:var(--accent);font-weight:800">₹${order.totalAmount || 0}</span>
            </div>
            <div class="tracking-detail-row">
                <span class="tracking-detail-label">Payment</span>
                <span class="tracking-detail-value">${(order.paymentMethod || 'N/A').toUpperCase()}</span>
            </div>
            <div class="tracking-detail-row">
                <span class="tracking-detail-label">Address</span>
                <span class="tracking-detail-value" style="font-size:0.78rem;max-width:200px;text-align:right">${order.address || 'N/A'}</span>
            </div>`;
    }

    document.getElementById("tracking-modal-overlay").classList.add("visible");
    document.getElementById("tracking-modal").classList.add("visible");
}

function closeTrackingModal() {
    document.getElementById("tracking-modal-overlay").classList.remove("visible");
    document.getElementById("tracking-modal").classList.remove("visible");
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 4: MOCK EMAIL NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
function sendMockEmail(orderId, payload, total) {
    // Simulate SES email send delay
    setTimeout(() => {
        showToast("📧 Confirmation email sent via Amazon SES", "success");
    }, 2000);
    setTimeout(() => {
        showToast("🔔 Restaurant notified via Amazon SNS", "info");
    }, 3500);
}

function sendStatusEmail(orderId, status) {
    const statusTitles = { CONFIRMED: "Order Confirmed", PREPARING: "Food Being Prepared", OUT_FOR_DELIVERY: "Out for Delivery", DELIVERED: "Order Delivered" };
    const title = statusTitles[status];
    if (title) {
        setTimeout(() => {
            showToast(`📧 Email sent: "${title}" — via SES`, "info");
        }, 1000);
    }
}

function showEmailPreview(orderId) {
    const order = getOrderById(orderId);
    const content = document.getElementById("email-preview-content");

    if (!order) {
        content.innerHTML = `<p>Order not found in local storage.</p>`;
    } else {
        const cartItems = order.cart || [];
        const tableRows = cartItems.map(c =>
            `<tr><td>${c.name}</td><td>×${c.qty}</td><td>₹${c.price * c.qty}</td></tr>`
        ).join("");

        content.innerHTML = `
            <div class="email-subject">🍔 QuickBite Order Confirmation — ${orderId}</div>
            <div class="email-from">From: orders@quickbite.aws • To: ${order.customerEmail || 'customer@email.com'}</div>
            <div class="email-body">
                <p>Hi <strong>${order.customerName || 'Customer'}</strong>,</p>
                <p>Thank you for your order! Here's your receipt:</p>
                <table class="email-order-table">
                    <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
                    <tbody>
                        ${tableRows}
                        <tr style="font-weight:700;border-top:2px solid var(--accent)">
                            <td colspan="2">Grand Total</td>
                            <td style="color:var(--accent)">₹${order.totalAmount || 0}</td>
                        </tr>
                    </tbody>
                </table>
                <p><strong>Payment:</strong> ${(order.paymentMethod || 'N/A').toUpperCase()}</p>
                <p><strong>Delivery Address:</strong><br>${order.address || 'N/A'}</p>
                <p><strong>Status:</strong> ${(order.status || 'PLACED').replace(/_/g, ' ')}</p>
                <div class="email-footer">
                    <p>This email was sent via <strong>Amazon SES</strong> • Restaurant notified via <strong>Amazon SNS</strong></p>
                    <p>QuickBite — Serverless Food Ordering on AWS</p>
                </div>
            </div>`;
    }

    document.getElementById("email-modal-overlay").classList.add("visible");
    document.getElementById("email-modal").classList.add("visible");
}

function closeEmailModal() {
    document.getElementById("email-modal-overlay").classList.remove("visible");
    document.getElementById("email-modal").classList.remove("visible");
}

function retryFailedOrder(orderId) {
    updateOrderStatus(orderId, "PLACED");
    startOrderTracking(orderId);
    showToast(`🔄 Order ${orderId} retried successfully`, "success");
    loadOrderHistory();
}

// ═══════════════════════════════════════════════════════════════
// FEATURE 5: ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderAdminDashboard() {
    const orders = getLocalOrders();

    // Stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const delivered = orders.filter(o => o.status === "DELIVERED").length;
    const failed = orders.filter(o => o.status === "FAILED").length;
    const successRate = totalOrders > 0 ? Math.round(((totalOrders - failed) / totalOrders) * 100) : 0;

    document.getElementById("stat-total-orders").textContent = totalOrders;
    document.getElementById("stat-total-revenue").textContent = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById("stat-avg-order").textContent = `₹${avgOrder}`;
    document.getElementById("stat-success-rate").textContent = `${successRate}%`;

    // Revenue Chart (last 7 days)
    renderRevenueChart(orders);

    // Popular Items
    renderPopularItems(orders);

    // Orders Table
    renderAdminOrders(orders);
}

function renderRevenueChart(orders) {
    const chart = document.getElementById("admin-chart");
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayRevenue = orders
            .filter(o => o.timestamp && o.timestamp.slice(0, 10) === dateStr)
            .reduce((s, o) => s + (o.totalAmount || 0), 0);
        days.push({ name: dayNames[d.getDay()], revenue: dayRevenue, date: dateStr });
    }

    const maxRevenue = Math.max(...days.map(d => d.revenue), 1);

    chart.innerHTML = days.map(d => {
        const height = Math.max(4, (d.revenue / maxRevenue) * 100);
        return `
            <div class="admin-chart-bar-wrap">
                <div class="admin-chart-bar-container">
                    <div class="admin-chart-bar" style="height:${height}%">
                        <div class="admin-chart-bar-value">₹${d.revenue}</div>
                    </div>
                </div>
                <div class="admin-chart-day">${d.name}</div>
            </div>`;
    }).join("");
}

function renderPopularItems(orders) {
    const itemCounts = {};
    for (const o of orders) {
        if (o.cart) {
            for (const c of o.cart) {
                itemCounts[c.name] = (itemCounts[c.name] || 0) + c.qty;
            }
        }
    }
    const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const container = document.getElementById("admin-popular-items");

    if (sorted.length === 0) {
        container.innerHTML = `<p style="color:var(--text-3);font-size:0.85rem">No item data yet</p>`;
        return;
    }

    container.innerHTML = sorted.map(([name, count], i) => `
        <div class="admin-popular-item">
            <div class="admin-popular-rank">${i + 1}</div>
            <div class="admin-popular-info">
                <div class="admin-popular-name">${name}</div>
                <div class="admin-popular-count">${count} ordered</div>
            </div>
        </div>
    `).join("");
}

function renderAdminOrders(orders) {
    const table = document.getElementById("admin-orders-table");
    const emptyEl = document.getElementById("admin-orders-empty");

    if (orders.length === 0) {
        table.innerHTML = "";
        emptyEl.style.display = "block";
        return;
    }
    emptyEl.style.display = "none";

    const statusClasses = {
        PLACED: 'placed', CONFIRMED: 'confirmed', PREPARING: 'preparing',
        OUT_FOR_DELIVERY: 'out-for-delivery', DELIVERED: 'delivered', FAILED: 'failed'
    };

    // Sort by timestamp desc
    const sorted = [...orders].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    table.innerHTML = `
        <div class="admin-order-row header">
            <div>Order ID</div>
            <div>Items</div>
            <div>Total</div>
            <div>Status</div>
            <div>Actions</div>
        </div>
    ` + sorted.map(o => {
        const status = o.status || 'PLACED';
        const sc = statusClasses[status] || 'placed';
        return `
            <div class="admin-order-row">
                <div class="admin-order-id">${o.orderId}</div>
                <div class="admin-order-items">${o.item || 'N/A'}</div>
                <div class="admin-order-total">₹${o.totalAmount || 0}</div>
                <div><span class="admin-order-status ${sc}">${status.replace(/_/g, ' ')}</span></div>
                <div class="admin-order-actions">
                    <button class="admin-action-btn track" onclick="openTrackingModal('${o.orderId}')">📍 Track</button>
                    <button class="admin-action-btn" onclick="showEmailPreview('${o.orderId}')">📧</button>
                    ${status !== 'DELIVERED' && status !== 'FAILED' ? `<button class="admin-action-btn" onclick="adminAdvanceStatus('${o.orderId}')" title="Advance status">⏭️</button>` : ''}
                </div>
            </div>`;
    }).join("");
}

function adminAdvanceStatus(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;
    const currentIdx = ORDER_STATUSES.findIndex(s => s.key === order.status);
    if (currentIdx < ORDER_STATUSES.length - 1) {
        const nextStatus = ORDER_STATUSES[currentIdx + 1].key;
        updateOrderStatus(orderId, nextStatus);
        showToast(`${ORDER_STATUSES[currentIdx + 1].icon} ${orderId} → ${ORDER_STATUSES[currentIdx + 1].title}`, "success");
        renderAdminDashboard();
    }
}



// ═════════════════════════════════════════════════════════════
// INTERACTIVE BACKGROUND CANVAS v2 — Premium Igloo-style
// Mouse-reactive particle network with animated gradients,
// flowing connections, parallax depth, and ambient orbs
// ═════════════════════════════════════════════════════════════
(function initBgCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [], orbs = [], animId;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 160;
    const MOUSE_RADIUS = 260;
    const MOUSE_ATTRACT = 0.018;
    const MOUSE_REPEL_CLOSE = 0.05;
    const REPEL_DIST = 80;

    // Mouse tracking with smooth interpolation
    let mouseX = -1000, mouseY = -1000;
    let targetMouseX = -1000, targetMouseY = -1000;
    let mouseVelX = 0, mouseVelY = 0;
    let prevMX = -1000, prevMY = -1000;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
        targetMouseX = -1000; targetMouseY = -1000;
    });

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const depth = Math.random() * 0.7 + 0.3; // parallax depth 0.3–1.0
            const layer = depth > 0.7 ? 2 : depth > 0.5 ? 1 : 0; // 3 depth layers
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                baseVx: (Math.random() - 0.5) * 0.3 * depth,
                baseVy: (Math.random() - 0.5) * 0.3 * depth,
                vx: 0, vy: 0,
                r: (Math.random() * 2.2 + 0.5) * depth,
                baseAlpha: (Math.random() * 0.3 + 0.08) * depth,
                alpha: 0,
                depth: depth,
                layer: layer,
                pulsePhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.008 + Math.random() * 0.012,
                hueShift: Math.random() > 0.7 // some particles use blue instead of orange
            });
        }
        // Glowing orbs (large, slow, ambient)
        orbs = [];
        const orbColors = [
            { r: 255, g: 153, b: 0 },   // AWS orange
            { r: 20, g: 110, b: 180 },   // AWS blue
            { r: 139, g: 92, b: 246 },   // purple accent
            { r: 255, g: 180, b: 50 },   // warm gold
        ];
        for (let i = 0; i < 4; i++) {
            orbs.push({
                x: Math.random() * w, y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.12,
                vy: (Math.random() - 0.5) * 0.12,
                radius: 150 + Math.random() * 150,
                color: orbColors[i],
                phase: Math.random() * Math.PI * 2,
                depth: 0.3 + Math.random() * 0.5
            });
        }
    }

    function isDark() {
        return document.documentElement.getAttribute('data-theme') !== 'light';
    }

    let time = 0;
    function draw() {
        ctx.clearRect(0, 0, w, h);
        time += 0.006;
        const dark = isDark();

        // Smooth mouse interpolation
        mouseX += (targetMouseX - mouseX) * 0.07;
        mouseY += (targetMouseY - mouseY) * 0.07;
        mouseVelX = mouseX - prevMX;
        mouseVelY = mouseY - prevMY;
        prevMX = mouseX; prevMY = mouseY;

        // --- Animated gradient background wash ---
        const gradShift1 = Math.sin(time * 0.5) * 0.5 + 0.5;
        const gradShift2 = Math.cos(time * 0.3) * 0.5 + 0.5;
        if (dark) {
            const bgGrad = ctx.createRadialGradient(
                w * (0.3 + gradShift1 * 0.4), h * (0.2 + gradShift2 * 0.3), 0,
                w * 0.5, h * 0.5, Math.max(w, h) * 0.7
            );
            bgGrad.addColorStop(0, `rgba(255,153,0,${0.015 + Math.sin(time) * 0.005})`);
            bgGrad.addColorStop(0.5, `rgba(20,110,180,${0.008 + Math.cos(time * 0.7) * 0.003})`);
            bgGrad.addColorStop(1, 'rgba(10,14,23,0)');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Draw animated gradient orbs ---
        for (const orb of orbs) {
            orb.x += orb.vx; orb.y += orb.vy;
            if (orb.x < -orb.radius || orb.x > w + orb.radius) orb.vx *= -1;
            if (orb.y < -orb.radius || orb.y > h + orb.radius) orb.vy *= -1;
            // Mouse parallax on orbs
            const orbParallax = 0.025 * orb.depth;
            const ox = orb.x + (mouseX - w / 2) * orbParallax;
            const oy = orb.y + (mouseY - h / 2) * orbParallax;
            const pulse = Math.sin(time * 1.2 + orb.phase) * 0.35 + 0.65;
            const alpha = dark ? 0.055 * pulse : 0.025 * pulse;
            const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.radius);
            grad.addColorStop(0, `rgba(${orb.color.r},${orb.color.g},${orb.color.b},${alpha})`);
            grad.addColorStop(0.6, `rgba(${orb.color.r},${orb.color.g},${orb.color.b},${alpha * 0.3})`);
            grad.addColorStop(1, `rgba(${orb.color.r},${orb.color.g},${orb.color.b},0)`);
            ctx.beginPath();
            ctx.arc(ox, oy, orb.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
        }

        const orangeColor = dark ? '255,153,0' : '200,120,0';
        const blueColor = dark ? '20,110,180' : '20,90,150';
        const purpleColor = dark ? '139,92,246' : '100,60,200';

        // --- Update particle positions ---
        for (const p of particles) {
            // Base velocity
            p.vx = p.baseVx;
            p.vy = p.baseVy;

            // Mouse interaction — attract towards mouse, repel if too close
            if (mouseX > 0 && mouseY > 0) {
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < REPEL_DIST && dist > 0) {
                    // Close: repel gently
                    const force = (1 - dist / REPEL_DIST) * MOUSE_REPEL_CLOSE * p.depth;
                    p.vx += (dx / dist) * force * 6;
                    p.vy += (dy / dist) * force * 6;
                } else if (dist < MOUSE_RADIUS && dist > REPEL_DIST) {
                    // Medium range: attract gently
                    const force = (1 - dist / MOUSE_RADIUS) * MOUSE_ATTRACT * p.depth;
                    p.vx -= (dx / dist) * force * 5;
                    p.vy -= (dy / dist) * force * 5;
                }
            }

            // Parallax offset based on mouse position
            const px = (mouseX - w / 2) * 0.02 * (1 - p.depth);
            const py = (mouseY - h / 2) * 0.02 * (1 - p.depth);
            p.x += p.vx + px * 0.08;
            p.y += p.vy + py * 0.08;

            // Smooth boundaries (wrap instead of bounce for seamless feel)
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
            if (p.y < -20) p.y = h + 20;
            if (p.y > h + 20) p.y = -20;

            // Pulse alpha
            p.pulsePhase += p.pulseSpeed;
            p.alpha = p.baseAlpha * (Math.sin(p.pulsePhase) * 0.25 + 0.75);
        }

        // --- Draw connections (layer-aware for depth) ---
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                // Only connect particles in same or adjacent layers
                if (Math.abs(particles[i].layer - particles[j].layer) > 1) continue;

                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = CONNECTION_DIST * Math.min(particles[i].depth, particles[j].depth) * 1.2;

                if (dist < maxDist) {
                    const opacity = (1 - dist / maxDist) * 0.1 * Math.min(particles[i].depth, particles[j].depth);
                    const useBlue = particles[i].hueShift || particles[j].hueShift;
                    const usePurple = (i + j) % 11 === 0;
                    const color = usePurple ? purpleColor : (useBlue ? blueColor : orangeColor);

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${color},${opacity})`;
                    ctx.lineWidth = 0.5 + Math.min(particles[i].depth, particles[j].depth) * 0.4;
                    ctx.stroke();
                }
            }

            // Mouse connection lines — brighter, more prominent
            if (mouseX > 0 && mouseY > 0) {
                const dx = particles[i].x - mouseX;
                const dy = particles[i].y - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS) {
                    const opacity = (1 - dist / MOUSE_RADIUS) * 0.18 * particles[i].depth;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.strokeStyle = `rgba(${orangeColor},${opacity})`;
                    ctx.lineWidth = 0.35 + (1 - dist / MOUSE_RADIUS) * 0.5;
                    ctx.stroke();
                }
            }
        }

        // --- Draw particles with layered glow ---
        for (const p of particles) {
            const a = p.alpha * 0.55;
            const dotColor = p.hueShift ? blueColor : orangeColor;

            // Outer glow (larger particles only)
            if (p.r > 1.0) {
                const glowSize = p.r * (3 + Math.sin(p.pulsePhase * 2) * 1);
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                glow.addColorStop(0, `rgba(${dotColor},${a * 0.35})`);
                glow.addColorStop(0.5, `rgba(${dotColor},${a * 0.1})`);
                glow.addColorStop(1, `rgba(${dotColor},0)`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            }

            // Core dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${dotColor},${a})`;
            ctx.fill();
        }

        // --- Mouse glow cursor ---
        if (mouseX > 0 && mouseY > 0 && dark) {
            const cursorGlow = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 120);
            cursorGlow.addColorStop(0, 'rgba(255,153,0,0.04)');
            cursorGlow.addColorStop(0.5, 'rgba(255,153,0,0.015)');
            cursorGlow.addColorStop(1, 'rgba(255,153,0,0)');
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 120, 0, Math.PI * 2);
            ctx.fillStyle = cursorGlow;
            ctx.fill();
        }

        animId = requestAnimationFrame(draw);
    }

    resize(); createParticles(); draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(animId); else draw();
    });
})();

