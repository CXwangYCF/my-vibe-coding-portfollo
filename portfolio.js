const body = document.body;
const toast = document.getElementById("toast");
const palmCursor = document.getElementById("palmCursor");
const sceneShell = document.getElementById("sceneShell");
const sceneBackdrop = document.getElementById("sceneBackdrop");
const farRainCanvas = document.getElementById("farRainCanvas");
const midRainCanvas = document.getElementById("midRainCanvas");
const rippleCanvas = document.getElementById("rippleCanvas");
const nearRainCanvas = document.getElementById("nearRainCanvas");
const globeButton = document.getElementById("globeButton");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const midCtx = midRainCanvas ? midRainCanvas.getContext("2d") : null;
const rippleCtx = rippleCanvas ? rippleCanvas.getContext("2d") : null;
const depthElements = Array.from(document.querySelectorAll("[data-depth]"));

const state = {
  target: { x: window.innerWidth * 0.3, y: window.innerHeight * 0.72 },
  pointer: { x: window.innerWidth * 0.3, y: window.innerHeight * 0.72 },
  ringScale: 1,
  ringTargetScale: 1,
  parallaxX: 0,
  parallaxY: 0,
  targetParallaxX: 0,
  targetParallaxY: 0,
  sceneRect: null,
  sceneWidth: 0,
  sceneHeight: 0,
  reflectionStart: 0,
  rainDrops: [],
  groundRipples: [],
  cursorRipples: [],
};

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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

function resizeCanvas(canvas, ctx, width, height, dpr) {
  if (!canvas || !ctx) return;
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createDrop(spawnAbove = false) {
  const width = state.sceneWidth;
  const height = state.sceneHeight;
  return {
    x: randomBetween(-12, width + 12),
    y: spawnAbove ? randomBetween(-height * 0.35, -16) : randomBetween(-height * 0.08, height),
    speed: randomBetween(4.4, 7),
    drift: randomBetween(-0.22, 0.18),
    length: randomBetween(10, 18),
    alpha: randomBetween(0.07, 0.17),
    lineWidth: randomBetween(0.55, 0.95),
    vx: 0,
    vy: 0,
    swaySeed: Math.random() * Math.PI * 2,
  };
}

function seedRain() {
  const count = isTouchDevice ? 34 : 58;
  state.rainDrops = Array.from({ length: count }, (_, index) => createDrop(index > count * 0.45));
}

function respawnDrop(drop) {
  Object.assign(drop, createDrop(true));
}

function addGroundRipple(x, y, energy = 1) {
  if (y < state.reflectionStart) return;

  state.groundRipples.push({
    x,
    y,
    energy,
    life: 0,
  });

  if (state.groundRipples.length > 24) {
    state.groundRipples.shift();
  }
}

function addCursorRipple(x, y, energy = 1) {
  state.cursorRipples.push({
    x,
    y,
    energy,
    life: 0,
  });

  if (state.cursorRipples.length > 16) {
    state.cursorRipples.shift();
  }
}

function getCursorField() {
  const rect = state.sceneRect || getSceneRect();
  if (!rect) {
    return {
      x: state.target.x,
      y: state.target.y,
      radius: 20 * state.ringScale,
      influence: 74 * state.ringScale,
    };
  }

  return {
    x: state.target.x - rect.left,
    y: state.target.y - rect.top,
    radius: 20 * state.ringScale,
    influence: 74 * state.ringScale,
  };
}

function resizeScene() {
  state.sceneRect = getSceneRect();
  if (!state.sceneRect) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const { width, height } = state.sceneRect;
  state.sceneWidth = width;
  state.sceneHeight = height;
  state.reflectionStart = height * 0.67;

  resizeCanvas(midRainCanvas, midCtx, width, height, dpr);
  resizeCanvas(rippleCanvas, rippleCtx, width, height, dpr);

  if (farRainCanvas) {
    farRainCanvas.width = 1;
    farRainCanvas.height = 1;
  }

  if (nearRainCanvas) {
    nearRainCanvas.width = 1;
    nearRainCanvas.height = 1;
  }

  seedRain();
}

function updateBackgroundParallax(time) {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;

  if (isTouchDevice || prefersReducedMotion) {
    state.target.x = vw * (0.34 + Math.sin(time * 0.13) * 0.022);
    state.target.y = vh * (0.7 + Math.cos(time * 0.15) * 0.018);
  }

  state.targetParallaxX = state.target.x / vw - 0.5;
  state.targetParallaxY = state.target.y / vh - 0.5;
  state.parallaxX = lerp(state.parallaxX, state.targetParallaxX, prefersReducedMotion ? 0.08 : 0.12);
  state.parallaxY = lerp(state.parallaxY, state.targetParallaxY, prefersReducedMotion ? 0.08 : 0.12);

  if (sceneBackdrop) {
    sceneBackdrop.style.transform =
      `translate3d(${state.parallaxX * 20}px, ${state.parallaxY * 14}px, 0) scale(1.06)`;
  }

  depthElements.forEach((element) => {
    const depth = element.getAttribute("data-depth");
    const factor = depth === "float" ? 1.1 : depth === "mid" ? 0.72 : 0.42;
    const driftY = depth === "float" ? Math.sin(time * 0.72 + factor) * 3 : 0;
    element.style.transform =
      `translate3d(${state.parallaxX * 18 * factor}px, ${state.parallaxY * 12 * factor + driftY}px, 0)`;
  });
}

function updateCursor() {
  if (!palmCursor || isTouchDevice) return;

  state.pointer.x = lerp(state.pointer.x, state.target.x, prefersReducedMotion ? 0.45 : 0.68);
  state.pointer.y = lerp(state.pointer.y, state.target.y, prefersReducedMotion ? 0.45 : 0.68);
  state.ringScale = lerp(state.ringScale, state.ringTargetScale, prefersReducedMotion ? 0.22 : 0.32);

  palmCursor.style.transform =
    `translate3d(${state.pointer.x}px, ${state.pointer.y}px, 0) scale(${state.ringScale})`;
}

function drawRain(time) {
  if (!midCtx) return;

  const width = state.sceneWidth;
  const height = state.sceneHeight;
  const cursor = getCursorField();

  midCtx.clearRect(0, 0, width, height);

  for (const drop of state.rainDrops) {
    const dx = cursor.x - drop.x;
    const dy = cursor.y - drop.y;
    const distance = Math.hypot(dx, dy);

    drop.vx *= 0.88;
    drop.vy *= 0.86;

    if (!isTouchDevice && distance < cursor.influence) {
      const force = clamp(1 - distance / cursor.influence, 0, 1);
      const side = drop.x < cursor.x ? -1 : 1;

      drop.vx += side * force * 0.28;
      drop.vy -= force * 0.16;

      if (distance < cursor.radius) {
        addCursorRipple(drop.x, drop.y, 0.75 + force * 0.45);
        respawnDrop(drop);
        continue;
      }
    }

    const sway = Math.sin(time * 1.1 + drop.swaySeed) * 0.05;
    drop.x += drop.drift + sway + drop.vx;
    drop.y += drop.speed + drop.vy;

    midCtx.strokeStyle = `rgba(232, 245, 235, ${drop.alpha.toFixed(3)})`;
    midCtx.lineWidth = drop.lineWidth;
    midCtx.beginPath();
    midCtx.moveTo(drop.x, drop.y);
    midCtx.lineTo(drop.x - 1.2, drop.y - drop.length);
    midCtx.stroke();

    if (drop.y >= state.reflectionStart) {
      addGroundRipple(drop.x, drop.y, 0.7);
      respawnDrop(drop);
      continue;
    }

    if (drop.y > height + 14 || drop.x < -18 || drop.x > width + 18) {
      respawnDrop(drop);
    }
  }
}

function drawRipples(time) {
  if (!rippleCtx) return;

  const width = state.sceneWidth;
  const height = state.sceneHeight;
  rippleCtx.clearRect(0, 0, width, height);

  for (const ripple of state.groundRipples) {
    ripple.life += 0.024;
    const alpha = Math.max(0, 0.14 * (1 - ripple.life));
    const radius = 7 + ripple.life * 22 * ripple.energy;

    rippleCtx.strokeStyle = `rgba(232, 243, 233, ${alpha.toFixed(3)})`;
    rippleCtx.lineWidth = 0.75;
    rippleCtx.beginPath();
    rippleCtx.ellipse(ripple.x, ripple.y, radius, radius * 0.4, 0, 0, Math.PI * 2);
    rippleCtx.stroke();
  }

  for (const ripple of state.cursorRipples) {
    ripple.life += 0.05;
    const alpha = Math.max(0, 0.12 * (1 - ripple.life));
    const radius = 4 + ripple.life * 18 * ripple.energy;

    rippleCtx.strokeStyle = `rgba(236, 247, 238, ${alpha.toFixed(3)})`;
    rippleCtx.lineWidth = 0.7;
    rippleCtx.beginPath();
    rippleCtx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
    rippleCtx.stroke();
  }

  state.groundRipples = state.groundRipples.filter((ripple) => ripple.life < 1);
  state.cursorRipples = state.cursorRipples.filter((ripple) => ripple.life < 1);

  rippleCtx.strokeStyle = "rgba(242, 248, 242, 0.028)";
  rippleCtx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const x = width * (0.22 + i * 0.23) + Math.sin(time * 0.4 + i) * 10;
    rippleCtx.beginPath();
    rippleCtx.moveTo(x, height * 0.16);
    rippleCtx.lineTo(x + 6, height * 0.56);
    rippleCtx.stroke();
  }
}

function animate(now) {
  const time = now * 0.001;
  updateCursor();
  updateBackgroundParallax(time);
  drawRain(time);
  drawRipples(time);
  window.requestAnimationFrame(animate);
}

window.addEventListener("pointermove", (event) => {
  state.target.x = event.clientX;
  state.target.y = event.clientY;
});

document.querySelectorAll("[data-cursor-hover]").forEach((element) => {
  element.addEventListener("pointerenter", () => {
    state.ringTargetScale = 1.12;
  });
  element.addEventListener("pointerleave", () => {
    state.ringTargetScale = 1;
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

window.addEventListener("resize", resizeScene);

resizeScene();
window.requestAnimationFrame(animate);
