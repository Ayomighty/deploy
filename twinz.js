/* ============================================================
   TWINZLOVE_PRODUCTS — SITE SCRIPT
   Handles: cart state, add-to-cart popup, cart badge,
   cart page rendering, login, signup, session state.

   Cart + accounts live in localStorage — there's no real backend
   yet, so this is a fully working demo (everything you click
   actually works) but it's not wired to a real database. See the
   notes near signup() below before treating this as production.
   ============================================================ */

const CART_KEY = "twinz_cart";
const USERS_KEY = "twinz_users";
const SESSION_KEY = "twinz_session";

/* ---------- Cart helpers ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
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

/* ---------- Cart badge (shown in the header on every page) ---------- */
function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = cartCount(getCart());
  badge.textContent = count;
  badge.classList.toggle("show", count > 0);
}

/* ---------- Accounts / session ---------- */
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ username: user.username, email: user.email })
  );
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "twinz.html";
}

function signup(username, email, password) {
  const users = getUsers();
  const emailTaken = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  const usernameTaken = users.some((u) => u.username.toLowerCase() === username.toLowerCase());
  if (emailTaken) return { ok: false, error: "An account with this email already exists." };
  if (usernameTaken) return { ok: false, error: "That username is already taken." };

  // Demo only: passwords are stored as plain text in localStorage.
  // A real backend would hash them (bcrypt/argon2) server-side and
  // never keep credentials in the browser at all.
  const user = { username, email, password };
  users.push(user);
  saveUsers(users);
  setSession(user);
  return { ok: true };
}

function login(identifier, password) {
  const users = getUsers();
  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === identifier.toLowerCase() ||
        u.username.toLowerCase() === identifier.toLowerCase()) &&
      u.password === password
  );
  if (!user) return { ok: false, error: "Incorrect email/username or password." };
  setSession(user);
  return { ok: true };
}

/* Reflect logged-in state in the header, on every page */
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

/* ============================================================
   PRODUCT PAGE — Add to Cart popup
   ============================================================ */
function initProductPopup() {
  const overlay = document.getElementById("cartOverlay");
  if (!overlay) return; // this page has no products/popup

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

  // Event delegation: catches every "Add to cart" button, including
  // the ones that are wrapped inside the page's <form> — preventDefault
  // stops that form from trying to submit/navigate.
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
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closePopup();
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

/* ============================================================
   CART PAGE
   ============================================================ */
function initCartPage() {
  const container = document.getElementById("cartItems");
  if (!container) return; // not on the cart page

  const summary = document.getElementById("cartSummary");
  const emptyState = document.getElementById("cartEmpty");
  const cartPageEl = document.querySelector(".cart-page");

  function render() {
    const cart = getCart();

    if (cart.length === 0) {
      container.innerHTML = "";
      summary.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";
    summary.style.display = "block";

    container.innerHTML = cart
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p>${formatNaira(item.price)} each</p>
        </div>
        <div class="cart-item-actions">
          <div class="qty-stepper">
            <button type="button" class="cart-qty-minus" aria-label="Decrease quantity">\u2212</button>
            <span>${item.quantity}</span>
            <button type="button" class="cart-qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <span class="cart-item-total">${formatNaira(item.price * item.quantity)}</span>
          <button type="button" class="cart-item-remove">Remove</button>
        </div>
      </div>`
      )
      .join("");

    const total = cartTotal(cart);
    summary.innerHTML = `
      <div class="cart-summary-row total">
        <span>Total</span>
        <span>${formatNaira(total)}</span>
      </div>
      <button type="button" id="cartPayBtn" class="cart-pay-btn">Pay Now</button>
    `;
  }

  // One delegated listener handles qty +/-, remove, AND the pay button —
  // that way it keeps working even after render() rebuilds the DOM.
  cartPageEl.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-item");
    if (row) {
      const id = row.dataset.id;
      const cart = getCart();
      const item = cart.find((i) => i.id === id);
      if (item) {
        if (e.target.closest(".cart-qty-plus")) {
          updateCartQuantity(id, item.quantity + 1);
          render();
        } else if (e.target.closest(".cart-qty-minus")) {
          updateCartQuantity(id, item.quantity - 1);
          render();
        } else if (e.target.closest(".cart-item-remove")) {
          removeFromCart(id);
          render();
        }
      }
      return;
    }

    if (e.target.closest("#cartPayBtn")) {
      const cart = getCart();
      if (cart.length === 0) return;
      const total = cartTotal(cart);
      cartPageEl.innerHTML = `
        <div class="cart-success">
          <h2>Order placed \u2713</h2>
          <p>Thanks for shopping with Twinzlove_products! Your total was ${formatNaira(total)}.</p>
          <p class="cart-success-note">(This is a demo checkout — no real payment was processed.)</p>
          <a href="twinz.html">Continue shopping</a>
        </div>
      `;
      clearCart();
    }
  });

  render();
}

/* ============================================================
   LOGIN PAGE
   ============================================================ */
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const errorBox = document.getElementById("loginError");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const identifier = document.getElementById("loginIdentifier").value.trim();
    const password = document.getElementById("loginPassword").value;

    const result = login(identifier, password);
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.add("show");
      return;
    }
    window.location.href = "twinz.html";
  });
}

/* ============================================================
   SIGNUP PAGE
   ============================================================ */
function initSignupPage() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const errorBox = document.getElementById("signupError");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    if (username.length < 3) return showError("Username must be at least 3 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("Enter a valid email address.");
    if (password.length < 6) return showError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return showError("Passwords don't match.");

    const result = signup(username, email, password);
    if (!result.ok) return showError(result.error);
    window.location.href = "twinz.html";
  });
}

/* ============================================================
   INIT — runs on every page (script tag has `defer`, so the DOM
   is already parsed by the time this file runs; DOMContentLoaded
   is added on top as a harmless safety net)
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  updateHeaderAuth();
  initProductPopup();
  initCartPage();
  initLoginPage();
  initSignupPage();
});
