const body = document.body;
const toast = document.getElementById("toast");
const palmCursor = document.getElementById("palmCursor");
const sceneShell = document.getElementById("sceneShell");
const sceneBackdrop = document.getElementById("sceneBackdrop");
const rainCanvas = document.getElementById("rainCanvas");
const waterCanvas = document.getElementById("waterCanvas");
const waterShell = document.getElementById("waterShell");
const globeButton = document.getElementById("globeButton");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const rainCtx = rainCanvas ? rainCanvas.getContext("2d") : null;
const waterCtx = waterCanvas ? waterCanvas.getContext("2d") : null;

const state = {
  pointer: { x: window.innerWidth * 0.54, y: window.innerHeight * 0.48 },
  target: { x: window.innerWidth * 0.54, y: window.innerHeight * 0.48 },
  palmScale: 1,
  palmTargetScale: 1,
  parallaxX: 0,
  parallaxY: 0,
  targetParallaxX: 0,
  targetParallaxY: 0,
  drops: [],
  splashes: [],
  ripples: [],
  lastTouchSplashAt: 0,
  waterTop: 0,
  sceneRect: null,
};

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function getSceneRect() {
  return sceneShell ? sceneShell.getBoundingClientRect() : null;
}

function getPalmHitPoint() {
  const rect = state.sceneRect || getSceneRect();
  if (!rect) {
    return { x: state.pointer.x, y: state.pointer.y, radiusX: 28, radiusY: 34 };
  }

  const x = state.pointer.x - rect.left + 20;
  const y = state.pointer.y - rect.top + 30;
  return {
    x,
    y,
    radiusX: 28 * state.palmScale,
    radiusY: 34 * state.palmScale,
  };
}

function resizeCanvases() {
  state.sceneRect = getSceneRect();
  if (!state.sceneRect) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const { width, height } = state.sceneRect;

  if (rainCtx && rainCanvas) {
    rainCanvas.width = Math.max(1, Math.floor(width * dpr));
    rainCanvas.height = Math.max(1, Math.floor(height * dpr));
    rainCanvas.style.width = `${width}px`;
    rainCanvas.style.height = `${height}px`;
    rainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  if (waterCtx && waterCanvas && waterShell) {
    const waterRect = waterShell.getBoundingClientRect();
    waterCanvas.width = Math.max(1, Math.floor(waterRect.width * dpr));
    waterCanvas.height = Math.max(1, Math.floor(waterRect.height * dpr));
    waterCanvas.style.width = `${waterRect.width}px`;
    waterCanvas.style.height = `${waterRect.height}px`;
    waterCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.waterTop = waterRect.top - state.sceneRect.top;
  }

  seedDrops();
}

function createDrop(spawnTop = false) {
  if (!state.sceneRect) return null;
  const { width, height } = state.sceneRect;
  return {
    x: Math.random() * width,
    y: spawnTop ? Math.random() * -height * 0.2 : Math.random() * height,
    z: Math.random(),
    speed: 10 + Math.random() * 10,
    drift: -0.6 + Math.random() * 1.2,
    length: 10 + Math.random() * 16,
    alpha: 0.18 + Math.random() * 0.22,
    vx: 0,
    vy: 0,
    captured: false,
  };
}

function seedDrops() {
  if (!state.sceneRect) return;
  const dropCount = isTouchDevice ? 130 : 190;
  state.drops = Array.from({ length: dropCount }, (_, index) => createDrop(index > dropCount * 0.5));
}

function respawnDrop(drop) {
  if (!state.sceneRect) return;
  const next = createDrop(true);
  Object.assign(drop, next);
}

function addRipple(x, y, energy = 1, fromPalm = false) {
  if (!state.sceneRect) return;
  if (y < state.waterTop - 6) return;

  state.ripples.push({
    x,
    y: y - state.waterTop,
    life: 0,
    energy,
    fromPalm,
  });

  if (state.ripples.length > 24) {
    state.ripples.shift();
  }
}

function addPalmSplash(x, y) {
  const now = performance.now();
  if (now - state.lastTouchSplashAt < 28) return;
  state.lastTouchSplashAt = now;

  for (let i = 0; i < 6; i += 1) {
    state.splashes.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.6,
      vy: -1.4 - Math.random() * 1.2,
      life: 0,
      alpha: 0.34 + Math.random() * 0.18,
      size: 1.2 + Math.random() * 1.8,
    });
  }

  if (state.splashes.length > 120) {
    state.splashes.splice(0, state.splashes.length - 120);
  }
}

function drawRain(time) {
  if (!rainCtx || !rainCanvas || !state.sceneRect) return;
  const width = rainCanvas.clientWidth;
  const height = rainCanvas.clientHeight;
  rainCtx.clearRect(0, 0, width, height);

  const palm = getPalmHitPoint();

  for (const drop of state.drops) {
    const dx = palm.x - drop.x;
    const dy = palm.y - drop.y;
    const nearPalm =
      dy > -70 &&
      dy < 110 &&
      Math.abs(dx) < 90;

    if (nearPalm && !isTouchDevice) {
      const attract = clamp(1 - Math.hypot(dx * 0.9, dy * 0.7) / 92, 0, 1);
      if (attract > 0) {
        drop.vx = lerp(drop.vx, dx * 0.016, 0.2);
        drop.vy = lerp(drop.vy, dy * 0.022, 0.22);
      }

      if (
        Math.abs(dx) < palm.radiusX &&
        Math.abs(dy) < palm.radiusY
      ) {
        addPalmSplash(palm.x, palm.y);
        respawnDrop(drop);
        continue;
      }
    } else {
      drop.vx *= 0.92;
      drop.vy *= 0.88;
    }

    drop.x += drop.drift + drop.vx;
    drop.y += drop.speed + drop.vy;

    const tailX = drop.x - 2.4;
    const tailY = drop.y - drop.length;
    const strokeAlpha = drop.alpha * (0.7 + drop.z * 0.6);
    rainCtx.strokeStyle = `rgba(233, 245, 236, ${strokeAlpha.toFixed(3)})`;
    rainCtx.lineWidth = 0.6 + drop.z * 0.7;
    rainCtx.beginPath();
    rainCtx.moveTo(drop.x, drop.y);
    rainCtx.lineTo(tailX, tailY);
    rainCtx.stroke();

    if (drop.y >= state.waterTop) {
      addRipple(drop.x, drop.y, 0.5 + drop.z * 0.35, false);
      respawnDrop(drop);
      continue;
    }

    if (drop.y > height + 8 || drop.x < -18 || drop.x > width + 18) {
      respawnDrop(drop);
    }
  }

  for (const splash of state.splashes) {
    splash.x += splash.vx;
    splash.y += splash.vy;
    splash.vy += 0.08;
    splash.life += 0.03;

    const alpha = Math.max(0, splash.alpha * (1 - splash.life));
    rainCtx.fillStyle = `rgba(240, 248, 242, ${alpha.toFixed(3)})`;
    rainCtx.beginPath();
    rainCtx.arc(splash.x, splash.y, splash.size, 0, Math.PI * 2);
    rainCtx.fill();
  }

  rainCtx.strokeStyle = "rgba(244, 249, 244, 0.06)";
  rainCtx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const x = width * (0.18 + i * 0.18) + Math.sin(time * 0.4 + i) * 18;
    rainCtx.beginPath();
    rainCtx.moveTo(x, height * 0.14);
    rainCtx.lineTo(x + 8, height * 0.62);
    rainCtx.stroke();
  }

  state.splashes = state.splashes.filter((splash) => splash.life < 1);
}

function drawWater(time) {
  if (!waterCtx || !waterCanvas) return;
  const width = waterCanvas.clientWidth;
  const height = waterCanvas.clientHeight;
  waterCtx.clearRect(0, 0, width, height);

  const base = waterCtx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "rgba(220, 236, 219, 0.05)");
  base.addColorStop(0.14, "rgba(168, 190, 164, 0.12)");
  base.addColorStop(0.52, "rgba(76, 98, 77, 0.28)");
  base.addColorStop(1, "rgba(10, 16, 12, 0.52)");
  waterCtx.fillStyle = base;
  waterCtx.fillRect(0, 0, width, height);

  const bands = [
    { x: 0.18, w: 0.11, alpha: 0.08 },
    { x: 0.47, w: 0.07, alpha: 0.16 },
    { x: 0.66, w: 0.06, alpha: 0.1 },
    { x: 0.82, w: 0.05, alpha: 0.14 },
  ];

  for (const band of bands) {
    const x = width * band.x + Math.sin(time * 0.65 + band.x * 10) * 6;
    const w = width * band.w;
    const grad = waterCtx.createLinearGradient(x, 0, x, height);
    grad.addColorStop(0, `rgba(244, 248, 244, ${band.alpha})`);
    grad.addColorStop(1, "rgba(244, 248, 244, 0)");
    waterCtx.fillStyle = grad;
    waterCtx.fillRect(x, 0, w, height);
  }

  for (let y = 8; y < height; y += 14) {
    waterCtx.beginPath();
    for (let x = 0; x <= width + 14; x += 16) {
      let offset =
        Math.sin(x * 0.028 + y * 0.035 + time * 1.22) * 1.8 +
        Math.cos(x * 0.012 - time * 1.05 + y * 0.026) * 1.2;

      for (const ripple of state.ripples) {
        const dx = x - ripple.x;
        const dy = y - ripple.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const decay = Math.exp(-distance / (ripple.fromPalm ? 120 : 90));
        offset +=
          Math.sin(distance * 0.14 - ripple.life * 10) *
          decay *
          ripple.energy *
          (ripple.fromPalm ? 4.8 : 3.6);
      }

      if (x === 0) {
        waterCtx.moveTo(x, y + offset);
      } else {
        waterCtx.lineTo(x, y + offset);
      }
    }

    const alpha = 0.028 + (y / height) * 0.06;
    waterCtx.strokeStyle = `rgba(233, 244, 235, ${alpha.toFixed(3)})`;
    waterCtx.lineWidth = 1;
    waterCtx.stroke();
  }

  state.ripples = state.ripples.filter((ripple) => ripple.life < 1.25);
  for (const ripple of state.ripples) {
    ripple.life += ripple.fromPalm ? 0.022 : 0.018;
  }
}

function updateDepths(time) {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;

  if (isTouchDevice || prefersReducedMotion) {
    state.target.x = vw * (0.52 + Math.sin(time * 0.15) * 0.06);
    state.target.y = vh * (0.44 + Math.cos(time * 0.17) * 0.04);
  }

  const nx = state.target.x / vw - 0.5;
  const ny = state.target.y / vh - 0.5;

  state.targetParallaxX = nx;
  state.targetParallaxY = ny;
  state.parallaxX = lerp(state.parallaxX, state.targetParallaxX, prefersReducedMotion ? 0.05 : 0.08);
  state.parallaxY = lerp(state.parallaxY, state.targetParallaxY, prefersReducedMotion ? 0.05 : 0.08);

  if (sceneBackdrop) {
    const x = state.parallaxX * 26;
    const y = state.parallaxY * 18;
    const scale = isTouchDevice ? 1.06 : 1.08;
    sceneBackdrop.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }

  document.querySelectorAll("[data-depth]").forEach((element) => {
    const depth = element.getAttribute("data-depth");
    const factorMap = {
      slow: 0.5,
      mid: 0.9,
      float: 1.3,
    };
    const factor = factorMap[depth] || 0.6;
    const moveX = state.parallaxX * factor * 24;
    const moveY = state.parallaxY * factor * 16;
    const driftY = depth === "float" ? Math.sin(time * 0.8 + factor) * 5 : 0;
    element.style.transform = `translate3d(${moveX}px, ${moveY + driftY}px, 0)`;
  });
}

function updatePalm() {
  if (!palmCursor || isTouchDevice) return;

  state.pointer.x = lerp(state.pointer.x, state.target.x, prefersReducedMotion ? 0.14 : 0.2);
  state.pointer.y = lerp(state.pointer.y, state.target.y, prefersReducedMotion ? 0.14 : 0.2);
  state.palmScale = lerp(state.palmScale, state.palmTargetScale, prefersReducedMotion ? 0.12 : 0.16);

  const rotation = clamp((state.target.x - state.pointer.x) * 0.08, -10, 10);
  palmCursor.style.transform =
    `translate3d(${state.pointer.x}px, ${state.pointer.y}px, 0) rotate(${rotation}deg) scale(${state.palmScale})`;
}

function animate(now) {
  const time = now * 0.001;
  updatePalm();
  updateDepths(time);
  drawRain(time);
  drawWater(time);
  window.requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  state.target.x = event.clientX;
  state.target.y = event.clientY;
});

document.querySelectorAll("[data-cursor-hover]").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    state.palmTargetScale = 1.12;
  });
  element.addEventListener("pointerleave", () => {
    state.palmTargetScale = 1;
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
    showToast("Rain mode is live.");
  });
}

if (isTouchDevice) {
  body.classList.add("is-touch");
}

window.addEventListener("resize", resizeCanvases);

resizeCanvases();
window.requestAnimationFrame(animate);
