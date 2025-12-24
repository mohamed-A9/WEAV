/*  Spin The Wheel - Vanilla JS + Canvas
    - 6 slices, precise stopping
    - easing animation, random outcome
    - localStorage one-spin-per-visit demo
    - "Spin again" lets user spin again immediately (doesn't lock)
    - NO sound
    - NO coupons / copy / reset
*/

(() => {
  "use strict";

  const STORAGE_KEY = "spin_demo_locked_v1";

  // Updated: "Just vibes 😎" replaced by "15% OFF"
  const slices = [
    "10% OFF",
    "Free keychain",
    "Free bracelet",
    "5% OFF",
    "Spin again",
    "15% OFF"
  ];

  const sliceColors = [
    "#ff5c8a",
    "#6ee7ff",
    "#a78bfa",
    "#34d399",
    "#fbbf24",
    "#94a3b8"
  ];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");

  const spinBtn = document.getElementById("spinBtn");
  const resultText = document.getElementById("resultText");
  const termsText = document.getElementById("termsText");

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  let size = 560;
  let radius = size / 2;

  let rotation = 0;
  let isSpinning = false;
  let animationId = null;

  // Pointer is at top
  const POINTER_ANGLE = -Math.PI / 2;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function getLocked() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }
  function setLocked(val) {
    localStorage.setItem(STORAGE_KEY, val ? "1" : "0");
  }

  function updateSpinAvailability() {
    const locked = getLocked();
    if (locked) {
      spinBtn.disabled = true;
      spinBtn.textContent = "SPIN (locked)";
      termsText.textContent = "One spin per visit.";
    } else {
      spinBtn.disabled = false;
      spinBtn.textContent = "SPIN";
      termsText.textContent = "One spin per visit (demo).";
    }
  }

  function resizeCanvas() {
    const maxCss = 480;
    const containerWidth = canvas.getBoundingClientRect().width || maxCss;
    const cssSize = clamp(containerWidth, 280, maxCss);

    size = Math.round(cssSize);
    radius = size / 2;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel(rotation);
  }

  function drawWheel(rot) {
    ctx.clearRect(0, 0, size, size);

    const cx = radius;
    const cy = radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fill();
    ctx.restore();

    const sliceCount = slices.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;

    for (let i = 0; i < sliceCount; i++) {
      const start = rot + i * sliceAngle;
      const end = start + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 10, start, end);
      ctx.closePath();

      ctx.fillStyle = sliceColors[i % sliceColors.length];
      ctx.globalAlpha = 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const label = slices[i];
      const mid = (start + end) / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

// --- Text styling (phone-perfect, responsive) ---
      const fontSize = Math.round(
      Math.max(16, Math.min(22, size * 0.055)) // scales nicely on phones
      );

      ctx.font = `900 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
      ctx.fillStyle = "rgba(10,12,18,0.92)";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;

// Move text inward safely (prevents touching borders / needle)
      const textRadius = radius * 0.52; // sweet spot for 6 slices
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, textRadius, 0);

      ctx.restore();

      }

    // Center cap
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.085, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "rgba(15,18,30,0.9)";
    ctx.fill();
    ctx.restore();
  }

  function getSliceIndexAtPointer(rot) {
    const sliceCount = slices.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;

    let a = POINTER_ANGLE - rot;
    a = ((a % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

    return Math.floor(a / sliceAngle);
  }

  function rotationToCenterSlice(index) {
    const sliceCount = slices.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;
    return POINTER_ANGLE - (index + 0.5) * sliceAngle;
  }

  function startSpin() {
    if (isSpinning) return;

    if (getLocked()) {
      resultText.textContent = "You already played (demo).";
      return;
    }

    isSpinning = true;
    spinBtn.disabled = true;

    // Random outcome
    const targetIndex = Math.floor(Math.random() * slices.length);

    const baseTarget = rotationToCenterSlice(targetIndex);
    const turns = 5 + Math.floor(Math.random() * 4); // 5..8
    const finalRotation = baseTarget + turns * Math.PI * 2;

    const startRotation = rotation;
    const delta = finalRotation - startRotation;

    const duration = 3200 + Math.random() * 800;
    const startTime = performance.now();

    function frame(now) {
      const t = clamp((now - startTime) / duration, 0, 1);
      const eased = easeOutCubic(t);

      rotation = startRotation + delta * eased;
      drawWheel(rotation);

      if (t < 1) {
        animationId = requestAnimationFrame(frame);
      } else {
        finishSpin();
      }
    }

    animationId = requestAnimationFrame(frame);
  }

  function finishSpin() {
    const idx = getSliceIndexAtPointer(rotation);
    const label = slices[idx];

    // Snap precisely
    rotation = rotationToCenterSlice(idx) + Math.round(rotation / (Math.PI * 2)) * (Math.PI * 2);
    drawWheel(rotation);

    showResult(label);

    // Lock logic
    if (label === "Spin again") {
      setLocked(false);
      spinBtn.disabled = false;
      spinBtn.textContent = "SPIN AGAIN";
    } else {
      setLocked(true);
      updateSpinAvailability();
    }

    isSpinning = false;
  }

  function showResult(label) {
    if (label === "Spin again") {
      resultText.textContent = "Spin again! 🔁 Your luck isn’t done yet.";
      return;
    }
    resultText.textContent = `${label} 🎉`;
  }

  function onKeyDown(e) {
    if ((e.key === "Enter" || e.key === " ") && document.activeElement === spinBtn) {
      e.preventDefault();
      spinBtn.click();
    }
  }

  function init() {
    if (localStorage.getItem(STORAGE_KEY) === null) setLocked(false);

    resizeCanvas();
    updateSpinAvailability();
    drawWheel(rotation);

    spinBtn.addEventListener("click", startSpin);
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("keydown", onKeyDown);
  }

  init();
})();
