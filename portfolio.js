const body = document.body;
const toast = document.getElementById("toast");
const cursor = document.getElementById("cursor");
const sceneOrbit = document.getElementById("sceneOrbit");
const waterCanvas = document.getElementById("waterCanvas");
const waterShell = document.getElementById("waterShell");
const globeButton = document.getElementById("globeButton");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const state = {
  pointer: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 },
  target: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.45 },
  cursorScale: 1,
  cursorTargetScale: 1,
  sceneX: 0,
  sceneY: 0,
  targetSceneX: 0,
  targetSceneY: 0,
  ripples: [],
  lastRippleAt: 0,
};

const ctx = waterCanvas ? waterCanvas.getContext("2d") : null;

if (isTouchDevice) {
  body.classList.add("is-touch");
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function resizeCanvas() {
  if (!ctx || !waterCanvas || !waterShell) return;
  const rect = waterShell.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  waterCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  waterCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  waterCanvas.style.width = `${rect.width}px`;
  waterCanvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function addRipple(clientX, clientY, energy = 1) {
  if (!waterShell) return;
  const rect = waterShell.getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return;
  }

  state.ripples.push({
    x: clientX - rect.left,
    y: clientY - rect.top,
    radius: 8,
    life: 0,
    energy,
  });

  if (state.ripples.length > 9) {
    state.ripples.shift();
  }
}

function drawWater(time) {
  if (!ctx || !waterCanvas || !waterShell) return;

  const width = waterCanvas.clientWidth;
  const height = waterCanvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "rgba(244, 249, 244, 0.05)");
  base.addColorStop(0.24, "rgba(225, 236, 228, 0.24)");
  base.addColorStop(0.7, "rgba(170, 189, 178, 0.22)");
  base.addColorStop(1, "rgba(124, 149, 136, 0.3)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const reflections = [
    { x: 0.14, w: 0.06, alpha: 0.18 },
    { x: 0.31, w: 0.08, alpha: 0.14 },
    { x: 0.52, w: 0.12, alpha: 0.12 },
    { x: 0.67, w: 0.05, alpha: 0.2 },
    { x: 0.84, w: 0.08, alpha: 0.14 },
  ];

  reflections.forEach((item, index) => {
    const x = width * item.x + Math.sin(time * 0.8 + index) * 4;
    const w = width * item.w;
    const grad = ctx.createLinearGradient(x, 0, x, height);
    grad.addColorStop(0, `rgba(255,255,255,${item.alpha})`);
    grad.addColorStop(0.35, "rgba(235,246,238,0.09)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, height);
  });

  for (let y = 8; y < height; y += 16) {
    ctx.beginPath();
    for (let x = 0; x <= width + 12; x += 18) {
      let offset =
        Math.sin(x * 0.022 + y * 0.045 + time * 1.45) * 2.2 +
        Math.cos(x * 0.013 - time * 1.12 + y * 0.03) * 1.2;

      for (const ripple of state.ripples) {
        const dx = x - ripple.x;
        const dy = y - ripple.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const decay = Math.exp(-distance / 150);
        offset +=
          Math.sin(distance * 0.115 - ripple.life * 10) *
          decay *
          ripple.energy *
          5.5;
      }

      if (x === 0) {
        ctx.moveTo(x, y + offset);
      } else {
        ctx.lineTo(x, y + offset);
      }
    }

    const alpha = 0.04 + (y / height) * 0.08;
    ctx.strokeStyle = `rgba(248, 253, 248, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath();
  ctx.ellipse(width * 0.2, height * 0.2, width * 0.18, height * 0.08, 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(223, 240, 232, 0.1)";
  ctx.beginPath();
  ctx.ellipse(width * 0.74, height * 0.74, width * 0.16, height * 0.11, -0.2, 0, Math.PI * 2);
  ctx.fill();

  state.ripples = state.ripples.filter((ripple) => ripple.life < 1.25);
  state.ripples.forEach((ripple) => {
    ripple.life += 0.016;
    ripple.radius += 1.8 + ripple.energy * 0.4;
  });
}

function updateParallax(time) {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;

  if (isTouchDevice || prefersReducedMotion) {
    state.target.x = vw * (0.5 + Math.sin(time * 0.16) * 0.06);
    state.target.y = vh * (0.44 + Math.cos(time * 0.18) * 0.04);
  }

  const normalizedX = state.target.x / vw - 0.5;
  const normalizedY = state.target.y / vh - 0.5;

  state.targetSceneX = normalizedX;
  state.targetSceneY = normalizedY;
  state.sceneX = lerp(state.sceneX, state.targetSceneX, prefersReducedMotion ? 0.06 : 0.08);
  state.sceneY = lerp(state.sceneY, state.targetSceneY, prefersReducedMotion ? 0.06 : 0.08);

  if (sceneOrbit) {
    const rotateY = state.sceneX * 8;
    const rotateX = state.sceneY * -5;
    const translateX = state.sceneX * 20;
    const translateY = state.sceneY * 14;
    sceneOrbit.style.transform =
      `translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  document.querySelectorAll("[data-depth]").forEach((element) => {
    const depth = element.getAttribute("data-depth");
    const factorMap = {
      slow: 0.45,
      mid: 0.8,
      deep: 1.15,
      float: 1.55,
    };

    const factor = factorMap[depth] || 0.6;
    const x = state.sceneX * factor * 22;
    const y = state.sceneY * factor * 16;
    const floatY = depth === "float" ? Math.sin(time * 1.1 + factor) * 4 : 0;
    const floatX = depth === "float" ? Math.cos(time * 0.9 + factor) * 3 : 0;
    element.style.transform = `translate3d(${x + floatX}px, ${y + floatY}px, 0)`;
  });
}

function updateCursor() {
  if (!cursor || isTouchDevice) return;

  state.pointer.x = lerp(state.pointer.x, state.target.x, prefersReducedMotion ? 0.16 : 0.22);
  state.pointer.y = lerp(state.pointer.y, state.target.y, prefersReducedMotion ? 0.16 : 0.22);
  state.cursorScale = lerp(
    state.cursorScale,
    state.cursorTargetScale,
    prefersReducedMotion ? 0.12 : 0.18
  );

  cursor.style.transform =
    `translate3d(${state.pointer.x}px, ${state.pointer.y}px, 0) scale(${state.cursorScale})`;
}

function animate(now) {
  const time = now * 0.001;
  updateCursor();
  updateParallax(time);
  drawWater(time);
  window.requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  state.target.x = event.clientX;
  state.target.y = event.clientY;

  if (!isTouchDevice) {
    const delta = Math.abs(event.movementX) + Math.abs(event.movementY);
    const now = performance.now();
    if (delta > 1 && now - state.lastRippleAt > 90) {
      addRipple(event.clientX, event.clientY, Math.min(1.2, 0.6 + delta * 0.06));
      state.lastRippleAt = now;
    }
  }
});

document.querySelectorAll("[data-cursor-hover]").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    state.cursorTargetScale = 1.7;
  });

  element.addEventListener("pointerleave", () => {
    state.cursorTargetScale = 1;
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast(`已复制：${value}`);
    } catch (error) {
      console.error(error);
      showToast("复制失败，请手动复制");
    }
  });
});

if (globeButton) {
  globeButton.addEventListener("click", () => {
    showToast("Jiangnan mode is live.");
  });
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
window.requestAnimationFrame(animate);
