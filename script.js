 
const products = [
  {
    id: 1, name: "Studio Headphones", category: "Tech",
    price: 2499, rating: "4.9", badge: "BESTSELLER",
    description: "Your own little world of sound.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 2, name: "Everyday Bottle", category: "Lifestyle",
    price: 899, rating: "4.8", badge: "DAILY FAVOURITE",
    description: "Hydration, without the fuss.",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 3, name: "Classic Timepiece", category: "Accessories",
    price: 1899, rating: "4.7", badge: "TIMELESS",
    description: "A quiet detail that says plenty.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 4, name: "Desk Companion", category: "Tech",
    price: 3299, rating: "4.9", badge: "EDITOR'S PICK",
    description: "A little more focus, every day.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 5, name: "Carry-All Tote", category: "Accessories",
    price: 699, rating: "4.6", badge: "EASY ESSENTIAL",
    description: "Room for all the little things.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 6, name: "Soft Glow Lamp", category: "Lifestyle",
    price: 1599, rating: "4.8", badge: "GOOD LIGHT",
    description: "Make your favourite corner glow.",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85"
  }
];

const FREE_DELIVERY_AT = 2000;
const money = amount => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(amount);

const $ = id => document.getElementById(id);

const productGrid = $("productGrid");
const cartDrawer = $("cartDrawer");
const overlay = $("overlay");
const checkoutModal = $("checkoutModal");
const toast = $("toast");

let activeCategory = "All";
let searchTerm = "";
let sortMode = "featured";
let wishlistOnly = false;
let cart = readStorage("novacart-cart", []);
let wishlist = readStorage("novacart-wishlist", []);
let toastTimer;

function readStorage(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage() {
  try {
    localStorage.setItem("novacart-cart", JSON.stringify(cart));
    localStorage.setItem("novacart-wishlist", JSON.stringify(wishlist));
  } catch {
    showToast("Browser storage is unavailable. Changes may not persist.");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getProduct(id) {
  return products.find(product => product.id === Number(id));
}

function renderProducts() {
  const filtered = products.filter(product => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const matchesSearch = `${product.name} ${product.category} ${product.description}`
      .toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWishlist = !wishlistOnly || wishlist.includes(product.id);
    return matchesCategory && matchesSearch && matchesWishlist;
  });

  if (sortMode === "price-low") filtered.sort((a, b) => a.price - b.price);
  if (sortMode === "price-high") filtered.sort((a, b) => b.price - a.price);
  if (sortMode === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

  productGrid.replaceChildren();
  $("productTotal").textContent = `${String(filtered.length).padStart(2, "0")} OBJECTS`;
  $("resultsNote").textContent = wishlistOnly
    ? `Showing ${filtered.length} saved favourite${filtered.length === 1 ? "" : "s"}`
    : `Showing ${filtered.length} of ${products.length} thoughtfully selected items`;

  if (!filtered.length) {
    const empty = createElement("div", "empty-results");
    empty.append(
      createElement("h3", null, wishlistOnly ? "Nothing saved just yet." : "Nothing found. Yet."),
      createElement("p", null, wishlistOnly
        ? "Tap the heart on an item to keep it here."
        : "Try another search or explore a different category.")
    );
    const reset = createElement("button", null, "Show all items");
    reset.addEventListener("click", resetFilters);
    empty.append(reset);
    productGrid.append(empty);
    return;
  }

  filtered.forEach((product, index) => {
    const card = createElement("article", "product-card");
    card.style.animationDelay = `${index * 55}ms`;

    const imageWrap = createElement("div", "product-image-wrap");
    const img = createElement("img", "product-image");
    img.src = product.image;
    img.alt = product.name;
    img.loading = "lazy";
    img.onerror = () => {
      img.onerror = null;
      img.src = "https://placehold.co/600x650/f0eee7/20231f?text=NovaCart";
    };

    const badge = createElement("span", "product-badge", product.badge);
    const heart = createElement("button", `wishlist-button ${wishlist.includes(product.id) ? "saved" : ""}`,
      wishlist.includes(product.id) ? "♥" : "♡");
    heart.type = "button";
    heart.setAttribute("aria-label", wishlist.includes(product.id)
      ? `Remove ${product.name} from wishlist`
      : `Save ${product.name} to wishlist`);
    heart.setAttribute("aria-pressed", String(wishlist.includes(product.id)));
    heart.addEventListener("click", () => toggleWishlist(product.id));

    const quickAdd = createElement("button", "quick-add", "Add to bag  +");
    quickAdd.type = "button";
    quickAdd.addEventListener("click", () => addToCart(product.id));

    imageWrap.append(img, badge, heart, quickAdd);

    const info = createElement("div", "product-info");
    const meta = createElement("div", "product-meta");
    meta.append(
      createElement("span", null, product.category.toUpperCase()),
      createElement("span", "product-rating", `★ ${product.rating}`)
    );

    const title = createElement("h3", null, product.name);
    const description = createElement("p", null, product.description);
    const bottom = createElement("div", "product-bottom");
    const price = createElement("span", "product-price", money(product.price));
    const add = createElement("button", "add-button", "+");
    add.type = "button";
    add.setAttribute("aria-label", `Add ${product.name} to bag`);
    add.addEventListener("click", () => addToCart(product.id));

    bottom.append(price, add);
    info.append(meta, title, description, bottom);
    card.append(imageWrap, info);
    productGrid.append(card);
  });
}

function resetFilters() {
  activeCategory = "All";
  searchTerm = "";
  sortMode = "featured";
  wishlistOnly = false;
  $("searchInput").value = "";
  $("sortSelect").value = "featured";
  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.category === "All");
  });
  $("wishlistViewButton").setAttribute("aria-pressed", "false");
  renderProducts();
}

function updateCounts() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $("cartCount").textContent = count;
  $("drawerCount").textContent = `(${count})`;
  $("wishlistCount").textContent = wishlist.length;
}

function addToCart(id) {
  const product = getProduct(id);
  if (!product) return;

  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, quantity: 1 });

  saveStorage();
  renderCart();
  showToast(`${product.name} added to your bag.`);
}

function changeQuantity(id, amount) {
  const item = cart.find(entry => entry.id === Number(id));
  if (!item) return;

  item.quantity += amount;
  if (item.quantity <= 0) {
    cart = cart.filter(entry => entry.id !== Number(id));
  }

  saveStorage();
  renderCart();
}

function removeFromCart(id) {
  const product = getProduct(id);
  cart = cart.filter(item => item.id !== Number(id));
  saveStorage();
  renderCart();
  showToast(`${product?.name || "Item"} removed from your bag.`);
}

function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return;

  if (wishlist.includes(product.id)) {
    wishlist = wishlist.filter(itemId => itemId !== product.id);
    showToast(`${product.name} removed from favourites.`);
  } else {
    wishlist.push(product.id);
    showToast(`${product.name} saved to favourites.`);
  }

  saveStorage();
  updateCounts();
  renderProducts();
}

function getTotals() {
  const subtotal = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_AT ? 0 : 99;
  return { subtotal, delivery, total: subtotal + delivery };
}

function renderCart() {
  cart = cart.filter(item => getProduct(item.id) && item.quantity > 0);
  updateCounts();

  const cartItems = $("cartItems");
  cartItems.replaceChildren();

  if (cart.length === 0) {
    const empty = createElement("div", "cart-empty");
    empty.append(
      createElement("div", "empty-icon", "♡"),
      createElement("h3", null, "Your bag is taking a break."),
      createElement("p", null, "Find something lovely to bring home.")
    );
    const browse = createElement("button", null, "Explore the collection ↗");
    browse.addEventListener("click", closeCart);
    empty.append(browse);
    cartItems.append(empty);
  } else {
    cart.forEach(item => {
      const product = getProduct(item.id);
      if (!product) return;

      const row = createElement("article", "cart-item");
      const img = createElement("img");
      img.src = product.image;
      img.alt = product.name;
      img.onerror = () => {
        img.onerror = null;
        img.src = "https://placehold.co/160x180/f0eee7/20231f?text=Item";
      };

      const details = createElement("div");
      details.append(
        createElement("div", "item-category", product.category),
        createElement("h3", null, product.name),
        createElement("div", "item-price", money(product.price))
      );

      const quantity = createElement("div", "quantity-controls");
      const minus = createElement("button", null, "−");
      minus.type = "button";
      minus.setAttribute("aria-label", `Decrease ${product.name} quantity`);
      minus.addEventListener("click", () => changeQuantity(product.id, -1));

      const number = createElement("span", null, item.quantity);

      const plus = createElement("button", null, "+");
      plus.type = "button";
      plus.setAttribute("aria-label", `Increase ${product.name} quantity`);
      plus.addEventListener("click", () => changeQuantity(product.id, 1));

      quantity.append(minus, number, plus);

      const remove = createElement("button", "remove-item", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => removeFromCart(product.id));

      details.append(quantity, remove);
      const total = createElement("strong", null, money(product.price * item.quantity));
      total.style.fontSize = "11px";
      row.append(img, details, total);
      cartItems.append(row);
    });
  }

  const totals = getTotals();
  $("cartSubtotal").textContent = money(totals.subtotal);
  $("deliveryCost").textContent = totals.delivery === 0
    ? (totals.subtotal === 0 ? money(0) : "FREE")
    : money(totals.delivery);
  $("cartTotal").textContent = money(totals.total);
  $("modalTotal").textContent = money(totals.total);

  const remaining = Math.max(0, FREE_DELIVERY_AT - totals.subtotal);
  $("shippingMessage").textContent = totals.subtotal === 0
    ? `Free delivery on orders over ${money(FREE_DELIVERY_AT)}.`
    : remaining > 0
      ? `You're ${money(remaining)} away from free delivery.`
      : "Lovely! Your delivery is on us.";
  $("shippingProgress").style.width =
    `${Math.min(100, totals.subtotal / FREE_DELIVERY_AT * 100)}%`;

  $("checkoutButton").disabled = cart.length === 0;
  saveStorage();
}

function openCart() {
  overlay.classList.add("visible");
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  $("closeCartButton").focus();
}

function closeCart() {
  overlay.classList.remove("visible");
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

function openCheckout() {
  if (!cart.length) {
    showToast("Add an item before checking out.");
    return;
  }

  closeCart();
  $("modalTotal").textContent = money(getTotals().total);
  checkoutModal.classList.add("open");
  checkoutModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  $("customerName").focus();
}

function closeCheckout() {
  checkoutModal.classList.remove("open");
  checkoutModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    wishlistOnly = false;
    $("wishlistViewButton").setAttribute("aria-pressed", "false");
    document.querySelectorAll(".filter").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });
    renderProducts();
  });
});

document.querySelectorAll("[data-nav-category]").forEach(link => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.navCategory;
    wishlistOnly = false;
    $("wishlistViewButton").setAttribute("aria-pressed", "false");
    document.querySelectorAll(".filter").forEach(button => {
      button.classList.toggle("active", button.dataset.category === activeCategory);
    });
    renderProducts();
  });
});

$("searchInput").addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  renderProducts();
});

$("sortSelect").addEventListener("change", event => {
  sortMode = event.target.value;
  renderProducts();
});

$("wishlistViewButton").addEventListener("click", () => {
  wishlistOnly = !wishlistOnly;
  activeCategory = "All";
  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle("active", button.dataset.category === "All");
  });
  $("wishlistViewButton").setAttribute("aria-pressed", String(wishlistOnly));
  renderProducts();
  $("shop").scrollIntoView({ behavior: "smooth" });
});

$("openCartButton").addEventListener("click", openCart);
$("closeCartButton").addEventListener("click", closeCart);
$("continueShoppingButton").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("checkoutButton").addEventListener("click", openCheckout);
$("closeModalButton").addEventListener("click", closeCheckout);

checkoutModal.addEventListener("click", event => {
  if (event.target === checkoutModal) closeCheckout();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeCheckout();
  }
});

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!cart.length) {
    closeCheckout();
    showToast("Your bag is empty.");
    return;
  }

  if (!$("checkoutForm").reportValidity()) return;

  const customer = $("customerName").value.trim();
  const orderId = `NC-${Date.now().toString().slice(-6)}`;
  const total = money(getTotals().total);

  closeCheckout();
  cart = [];
  saveStorage();
  renderCart();
  $("checkoutForm").reset();

  showToast(`Thank you, ${customer}! Demo order ${orderId} · ${total}. No payment was taken.`);
});

$("newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = $("emailInput").value.trim();

  if (!email || !$("emailInput").checkValidity()) {
    $("emailInput").reportValidity();
    return;
  }

  showToast("Thanks! Newsletter signup demo completed.");
  $("newsletterForm").reset();
});

renderProducts();
renderCart();

 
 