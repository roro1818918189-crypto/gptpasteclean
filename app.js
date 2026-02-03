// ================= ELEMENTS =================
const elInput = document.getElementById("input");
const elOutput = document.getElementById("output");
const elFoundBadge = document.getElementById("foundBadge");
const elDetails = document.getElementById("details");
const elStats = document.getElementById("stats");

const btnPaste = document.getElementById("btnPaste");
const btnClear = document.getElementById("btnClear");
const btnCopyClean = document.getElementById("btnCopyClean");

// Modal elements
const registerModal = document.getElementById("registerModal");
const closeRegisterModal = document.getElementById("closeRegisterModal");
const maybeLater = document.getElementById("maybeLater");

// ================= UTILS =================
function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function codeUPlus(ch) {
  return "U+" + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
}

// ================= UNICODE DETECTION =================
// Detect control + invisible characters
const SUSPICIOUS_MATCH =
  /[\u0000-\u001F\u007F-\u009F\u00A0\u00AD\u061C\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFE0F\uFEFF]/g;

const SUSPICIOUS_TEST =
  /[\u0000-\u001F\u007F-\u009F\u00A0\u00AD\u061C\u180E\u2000-\u200F\u2028-\u202F\u205F\u2060-\u206F\u3000\uFE0F\uFEFF]/;

// ================= ANALYZE =================
function analyze(text) {
  const raw = text ?? "";
  const map = new Map();

  const matches = raw.match(SUSPICIOUS_MATCH);
  if (matches) {
    for (const ch of matches) {
      const code = codeUPlus(ch);
      map.set(code, (map.get(code) || 0) + 1);
    }
  }

  const issues = [...map.entries()].map(([label, count]) => ({
    label,
    count,
  }));

  const total = issues.reduce((sum, i) => sum + i.count, 0);
  return { raw, issues, total };
}

// ================= RENDER =================
function renderDetails(issues) {
  if (!issues.length) {
    return "✅ No hidden or invisible characters detected.";
  }

  return issues
    .map(
      (i) =>
        `• <code>${escapeHtml(i.label)}</code> × <code>${i.count}</code>`
    )
    .join("<br>");
}

function renderHighlighted(raw) {
  let html = "";

  for (const ch of raw) {
    if (SUSPICIOUS_TEST.test(ch)) {
      html += `<span class="mark">${escapeHtml(codeUPlus(ch))}</span>`;
    } else {
      html += ch === "\n" ? "<br>" : escapeHtml(ch);
    }
  }

  return `<div class="dim">${html}</div>`;
}

// ================= UI UPDATE =================
function updateUI() {
  if (!elInput) return;

  const raw = elInput.value || "";
  const report = analyze(raw);

  // Badge
  elFoundBadge.textContent = `${report.total} hidden characters found`;
  elFoundBadge.classList.toggle("ok", report.total === 0);
  elFoundBadge.classList.toggle("error", report.total > 0);

  // Details
  elDetails.innerHTML = renderDetails(report.issues);

  // Output (detector only)
  elOutput.innerHTML = renderHighlighted(raw);

  // Stats
  if (elStats) {
    elStats.textContent = `Chars: ${raw.length}`;
  }
}

// ================= MODAL =================
function openRegisterModal() {
  if (!registerModal) return;
  registerModal.classList.remove("hidden");
  registerModal.setAttribute("aria-hidden", "false");
}

function closeRegisterModalFn() {
  if (!registerModal) return;
  registerModal.classList.add("hidden");
  registerModal.setAttribute("aria-hidden", "true");
}

// ================= EVENTS =================
btnPaste?.addEventListener("click", async () => {
  try {
    const clip = await navigator.clipboard.readText();
    elInput.value = clip;
    updateUI();
    if (elStats) elStats.textContent = "Pasted from clipboard.";
  } catch {
    if (elStats) elStats.textContent = "Clipboard permission blocked.";
  }
});

btnClear?.addEventListener("click", () => {
  elInput.value = "";
  elOutput.innerHTML = "";
  elDetails.innerHTML = "";
  elFoundBadge.textContent = "0 hidden characters found";
  if (elStats) elStats.textContent = "Cleared.";
});

// Copy clean text → open register modal ONLY
btnCopyClean?.addEventListener("click", (e) => {
  e.preventDefault();
  openRegisterModal();
});

// Modal close actions
closeRegisterModal?.addEventListener("click", closeRegisterModalFn);
maybeLater?.addEventListener("click", closeRegisterModalFn);

registerModal?.addEventListener("click", (e) => {
  if (e.target === registerModal) closeRegisterModalFn();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeRegisterModalFn();
});

// Input listeners
elInput?.addEventListener("input", updateUI);
elInput?.addEventListener("paste", () => setTimeout(updateUI, 0));

// ================= INIT =================
updateUI();
