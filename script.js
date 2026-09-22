// =========================================================
// SETUP: inject the SVG heart clip-path definition
// =========================================================
(function injectHeartClip() {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.innerHTML = `
    <defs>
      <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
        <path d="M0.5,0.92 C0.5,0.92 0.04,0.55 0.04,0.30
                 C0.04,0.14 0.17,0.04 0.32,0.04
                 C0.42,0.04 0.5,0.11 0.5,0.20
                 C0.5,0.11 0.58,0.04 0.68,0.04
                 C0.83,0.04 0.96,0.14 0.96,0.30
                 C0.96,0.55 0.5,0.92 0.5,0.92 Z" />
      </clipPath>
    </defs>`;
  document.body.prepend(svg);
})();

// =========================================================
// FLOATING HEARTS BACKGROUND DECORATION
// =========================================================
(function floatingHearts() {
  const container = document.getElementById("floaties");
  const glyphs = ["♡", "♥"];
  const count = 10;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "floaty";
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 14 + Math.random() * 18 + "px";
    const duration = 10 + Math.random() * 12;
    el.style.animationDuration = duration + "s";
    el.style.animationDelay = -Math.random() * duration + "s";
    container.appendChild(el);
  }
})();

// =========================================================
// SCREEN NAVIGATION
// =========================================================
function goToScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const next = document.getElementById(id);
  next.classList.add("active");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

// normalize helper: trims, lowercases, strips all internal whitespace
function normalize(str) {
  return str.trim().toLowerCase().replace(/\s+/g, "");
}

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  const card = el.closest(".card");
  card.classList.remove("shake");
  void card.offsetWidth; // force reflow so the animation can replay
  card.classList.add("shake");
}

function clearError(id) {
  document.getElementById(id).textContent = "\u00A0";
}

// =========================================================
// SCREEN 1 — first name
// =========================================================
document.getElementById("form-1").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = normalize(document.getElementById("input-1").value);
  if (val === "alex") {
    clearError("error-1");
    goToScreen("screen-2");
  } else {
    showError("error-1", "nope, try again 👀");
  }
});

// =========================================================
// SCREEN 2 — boyfriend's name
// =========================================================
document.getElementById("form-2").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = normalize(document.getElementById("input-2").value);
  if (val === "nathan") {
    clearError("error-2");
    goToScreen("screen-3");
    applyWheelDefaultsOnceVisible();
  } else {
    showError("error-2", "wrong guy, try again 😏");
  }
});

// =========================================================
// SCREEN 3 — date wheel picker
// =========================================================
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ITEM_HEIGHT = 42;

function buildWheel(listId, items, valueForIndex) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  items.forEach((label, i) => {
    const div = document.createElement("div");
    div.className = "wheel-item";
    div.textContent = label;
    div.dataset.value = valueForIndex(i);
    list.appendChild(div);
  });
  return list;
}

const wheelAppliers = [];

function setupWheelScroll(colId, listId, defaultIndex, onChange) {
  const col = document.getElementById(colId);
  const list = document.getElementById(listId);
  const items = list.children;

  function updateActive(index) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-active", i === index);
    }
    onChange(items[index].dataset.value);
  }

  function currentIndex() {
    return Math.max(0, Math.min(items.length - 1, Math.round(col.scrollTop / ITEM_HEIGHT)));
  }

  let scrollTimer = null;
  col.addEventListener("scroll", () => {
    updateActive(currentIndex());
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = currentIndex();
      col.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
      updateActive(idx);
    }, 120);
  });

  // Setting scrollTop while the parent screen is display:none has no
  // effect in most browsers, so we expose a function to apply the
  // default once the screen actually becomes visible.
  wheelAppliers.push(() => {
    col.scrollTop = defaultIndex * ITEM_HEIGHT;
    updateActive(defaultIndex);
  });
}

// The picker always starts on a NEUTRAL date (Jan 1, 2000) so it never
// gives away the answer.
let dateState = { month: null, day: null, year: null };

const WHEEL_START_YEAR = 1990;
const WHEEL_END_YEAR = 2026;

function initDatePicker() {
  // months — default index 0 -> January
  buildWheel("list-month", MONTHS, (i) => i + 1);
  setupWheelScroll("col-month", "list-month", 0, (v) => (dateState.month = Number(v)));

  // days — default index 0 -> day 1
  const dayLabels = Array.from({ length: 31 }, (_, i) => String(i + 1));
  buildWheel("list-day", dayLabels, (i) => i + 1);
  setupWheelScroll("col-day", "list-day", 0, (v) => (dateState.day = Number(v)));

  // years — default -> 2000
  const yearLabels = [];
  for (let y = WHEEL_START_YEAR; y <= WHEEL_END_YEAR; y++) yearLabels.push(String(y));
  buildWheel("list-year", yearLabels, (i) => WHEEL_START_YEAR + i);
  setupWheelScroll("col-year", "list-year", 2000 - WHEEL_START_YEAR, (v) => (dateState.year = Number(v)));
}

function applyWheelDefaultsOnceVisible() {
  // run across two animation frames so layout has settled after
  // the screen switches from display:none to display:flex
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wheelAppliers.forEach((apply) => apply());
    });
  });
}

initDatePicker();

document.getElementById("date-confirm").addEventListener("click", () => {
  if (dateState.month === 9 && dateState.day === 28 && dateState.year === 2024) {
    clearError("error-3");
    goToScreen("screen-4");
  } else {
    showError("error-3", "not the day, scroll again 🙈");
  }
});

// =========================================================
// SCREEN 4 — secret code
// =========================================================
document.getElementById("form-4").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = normalize(document.getElementById("input-4").value);
  if (val === "greentomatoes") {
    clearError("error-4");
    goToScreen("screen-main");
  } else {
    showError("error-4", "that's not it, try again 🙊");
  }
});

// =========================================================
// IMAGE FALLBACKS — cute placeholders if a photo file is missing
// =========================================================
function placeholderFor(el, text) {
  el.addEventListener("error", function () {
    this.replaceWith(
      Object.assign(document.createElement("div"), {
        style: `
          width:100%; height:100%;
          display:flex; align-items:center; justify-content:center;
          text-align:center; font-family:'Fredoka', sans-serif;
          font-weight:600; font-size:13px; color:#A9788D;
          padding:20px; line-height:1.4; min-height:120px;
        `,
        textContent: text,
      })
    );
  });
}

placeholderFor(document.getElementById("heart-photo"), "drop alextitle.png here \u2661");
placeholderFor(document.getElementById("axe-photo"), "drop axe.png here \u2661");
placeholderFor(document.getElementById("face-photo"), "drop face.png here \u2661");
placeholderFor(document.getElementById("meet-photo"), "drop meet.png here \u2661");

// =========================================================
// BOOK / NEWSPAPER OVERLAY — opens when the heart photo is clicked
// =========================================================
(function bookOverlay() {
  const trigger = document.getElementById("photo-trigger");
  const overlay = document.getElementById("book-overlay");
  const paper = document.getElementById("book-paper");
  const closeBtn = document.getElementById("book-close");

  function openBook() {
    overlay.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    paper.scrollTop = 0;
  }

  function closeBook() {
    overlay.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  trigger.addEventListener("click", openBook);
  closeBtn.addEventListener("click", closeBook);

  // clicking the dark backdrop (outside the paper) also closes it
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeBook();
  });

  // esc key closes it too
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeBook();
  });
})();