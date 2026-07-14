/* ============================================================
   TWINZLOVE_PRODUCTS — SITE SCRIPT
   Handles: cart state, add-to-cart popup, cart badge,
   cart page rendering, login, signup, session state, and search.
   ============================================================ */

const CART_KEY = "twinz_cart";
const USERS_KEY = "twinz_users";
const SESSION_KEY = "twinz_session";

/* ---------- Cart helpers ---------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } 
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  saveCart(cart);
}

function updateCartQuantity(id, quantity) {
  let cart = getCart();
  if (quantity <= 0) {
    cart = cart.filter((item) => item.id !== id);
  } else {
    const item = cart.find((item) => item.id === id);
    if (item) item.quantity = quantity;
  }
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter((item) => item.id !== id);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function formatNaira(amount) {
  return "\u20A6" + amount.toLocaleString("en-NG");
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = cartCount(getCart());
  badge.textContent = count;
  badge.classList.toggle("show", count > 0);
}

/* ---------- Accounts / session ---------- */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } 
  catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } 
  catch { return null; }
}
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, email: user.email }));
}
function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "index.html";
}

function updateHeaderAuth() {
  const loginLink = document.getElementById("login");
  if (!loginLink) return;
  const session = getSession();
  if (session) {
    loginLink.textContent = "Hi, " + session.username;
    loginLink.href = "#";
    loginLink.onclick = (e) => {
      e.preventDefault();
      if (confirm("Log out of your account?")) logout();
    };
  }
}

/* ---------- Search Functionality ---------- */
function initSearch() {
  const searchInput = document.getElementById("search");
  const searchForm = document.getElementById("searchbar");
  
  if (!searchInput || !searchForm) return;

  function performSearch(query) {
    const lowerQuery = query.toLowerCase().trim();
    const products = document.querySelectorAll(".product-item");
    
    products.forEach(product => {
      const title = product.querySelector(".product-title").textContent.toLowerCase();
      if (title.includes(lowerQuery)) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  }

  // Search while typing
  searchInput.addEventListener("input", (e) => {
    performSearch(e.target.value);
  });

  // Prevent form reload on enter
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearch(searchInput.value);
  });
}

/* ---------- Mobile Nav ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const panel = document.getElementById("former");
  if (!toggle || !panel) return;

  function closeMenu() {
    panel.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  panel.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("menu-open")) return;
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

/* ---------- Product Popup (Index Page) ---------- */
function initProductPopup() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return; 

  const popupImage = document.getElementById("popupImage");
  const popupName = document.getElementById("popupProductName");
  const popupPrice = document.getElementById("popupProductPrice");
  const qtyValue = document.getElementById("qtyValue");
  const popupTotal = document.getElementById("popupTotal");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const popupClose = document.getElementById("popupClose");
  const popupAddBtn = document.getElementById("popupAddBtn");
  const popupPayBtn = document.getElementById("popupPayBtn");

  const MAX_QTY = 20;
  let currentProduct = null;
  let quantity = 1;

  function readProductFromButton(btn) {
    return {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image,
    };
  }

  function render() {
    if (!currentProduct) return;
    popupImage.src = currentProduct.image;
    popupImage.alt = currentProduct.name;
    popupName.textContent = currentProduct.name;
    popupPrice.textContent = formatNaira(currentProduct.price) + " each";
    qtyValue.textContent = quantity;
    popupTotal.textContent = formatNaira(currentProduct.price * quantity);
    qtyMinus.disabled = quantity <= 1;
    qtyPlus.disabled = quantity >= MAX_QTY;
  }

  function openPopup(product) {
    currentProduct = product;
    quantity = 1;
    render();
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closePopup() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn) return;
    e.preventDefault();
    openPopup(readProductFromButton(btn));
  });

  qtyMinus.addEventListener("click", () => {
    if (quantity > 1) {
      quantity--;
      render();
    }
  });

  qtyPlus.addEventListener("click", () => {
    if (quantity < MAX_QTY) {
      quantity++;
      render();
    }
  });

  popupClose.addEventListener("click", closePopup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  
  popupAddBtn.addEventListener("click", () => {
    addToCart(currentProduct, quantity);
    popupAddBtn.textContent = "Added \u2713";
    setTimeout(() => {
      popupAddBtn.textContent = "Add to Cart";
      closePopup();
    }, 700);
  });

  popupPayBtn.addEventListener("click", () => {
    addToCart(currentProduct, quantity);
    window.location.href = "cart.html";
  });
}

/* ---------- Cart Page Dynamic UI ---------- */
function renderCartPage() {
  const container = document.getElementById("cart-items-container");
  const summary = document.getElementById("cart-summary");
  if (!container || !summary) return;

  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = `<p class="empty-message">Your shopping cart is empty.</p>`;
    summary.innerHTML = "";
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-page-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h3>${item.name}</h3>
        <p class="unit-price">${formatNaira(item.price)} each</p>
      </div>
      <div class="qty-stepper">
        <button type="button" class="cart-qty-minus" aria-label="Decrease quantity">&minus;</button>
        <span>${item.quantity}</span>
        <button type="button" class="cart-qty-plus" aria-label="Increase quantity">+</button>
      </div>
      <div class="cart-item-subtotal">
        ${formatNaira(item.price * item.quantity)}
      </div>
      <button type="button" class="remove-item-btn" aria-label="Remove item">&times;</button>
    </div>
  `).join("");

  summary.innerHTML = `
    <div class="summary-card">
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Total Items</span>
        <span>${cartCount(cart)}</span>
      </div>
      <div class="summary-row total">
        <span>Total Price</span>
        <span>${formatNaira(cartTotal(cart))}</span>
      </div>
      <button type="button" class="checkout-btn">Proceed to Checkout</button>
    </div>
  `;
}

function initCartPage() {
  const container = document.getElementById("cart-items-container");
  const summary = document.getElementById("cart-summary");
  if (!container || !summary) return;

  renderCartPage();

  container.addEventListener("click", (e) => {
    const itemRow = e.target.closest(".cart-page-item");
    if (!itemRow) return;
    const id = itemRow.dataset.id;
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (e.target.classList.contains("cart-qty-minus")) {
      updateCartQuantity(id, item.quantity - 1);
      renderCartPage();
    } else if (e.target.classList.contains("cart-qty-plus")) {
      updateCartQuantity(id, item.quantity + 1);
      renderCartPage();
    } else if (e.target.classList.contains("remove-item-btn")) {
      removeFromCart(id);
      renderCartPage();
    }
  });

  // Handle WhatsApp Checkout Redirect
  summary.addEventListener("click", (e) => {
    if (e.target.classList.contains("checkout-btn")) {
      const cart = getCart();
      if (cart.length === 0) return;
      
      let message = "Hello Twinzlove Products! I would like to place an order:\n\n";
      cart.forEach(item => {
        message += `* ${item.name} (Qty: ${item.quantity}) - ${formatNaira(item.price * item.quantity)}\n`;
      });
      message += `\n*Total Order Amount: ${formatNaira(cartTotal(cart))}*`;
      
      const encodedMessage = encodeURIComponent(message);
      // Opens WhatsApp chat with the contact number from your footer
      const whatsappUrl = `https://wa.me/2348162487439?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
    }
  });
}


/* ---------- Initialization ---------- */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  updateHeaderAuth();
  initMobileMenu();
  initSearch();
  initProductPopup();
  initCartPage(); // Fire the cart page compiler if container is detected
});
