/*
 * Neural field — the hero animation.
 *
 * Each dot is a simple leaky integrate-and-fire neuron:
 *   - its membrane potential slowly leaks back toward rest,
 *   - it receives small random input plus input from your cursor,
 *   - when the potential crosses threshold it "spikes", resets,
 *     and sends a pulse down each of its connections (axons),
 *   - when a pulse arrives, the target neuron's potential jumps up.
 * Chains of spikes ripple across the network like real activity.
 */
(function () {
  "use strict";

  const canvas = document.querySelector("[data-neural-field]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Model parameters
  const THRESHOLD = 1.0;
  const LEAK = 0.985;          // fraction of potential kept each frame
  const NOISE = 0.012;         // average random input per frame
  const SYNAPSE_WEIGHT = 0.42; // potential added when a pulse arrives
  const REFRACTORY = 40;       // frames a neuron rests after spiking
  const PULSE_SPEED = 0.022;   // fraction of an axon travelled per frame
  const LINKS_PER_NEURON = 3;

  // Colors (match the logo): neurons fire blue on the left of the screen
  // and pink-purple on the right, like the two hemispheres of the logo.
  const C_LINK = "140, 150, 235";   // soft periwinkle connections
  const C_REST = "150, 160, 240";
  const C_PULSE = "255, 255, 255";  // action potentials travel as white sparks
  const FIRE_STOPS = [              // left -> right across the screen
    [79, 195, 247],   // sky blue
    [58, 91, 234],    // logo blue
    [240, 56, 111],   // logo pink
    [181, 124, 240],  // logo purple
  ];
  function fireColor(x) {
    const t = Math.min(Math.max(x / (width || 1), 0), 1) * (FIRE_STOPS.length - 1);
    const i = Math.min(Math.floor(t), FIRE_STOPS.length - 2);
    const f = t - i, a = FIRE_STOPS[i], b = FIRE_STOPS[i + 1];
    return a.map((c, k) => Math.round(c + (b[k] - c) * f)).join(", ");
  }

  let width = 0, height = 0, dpr = 1;
  let neurons = [];
  let pulses = [];
  let running = false;
  let frame = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    const count = Math.max(40, Math.min(150, Math.round((width * height) / 9500)));
    neurons = [];
    pulses = [];
    for (let i = 0; i < count; i++) {
      neurons.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.12, 0.12),
        v: rand(0, 0.8),          // membrane potential
        refractory: 0,
        glow: 0,
        r: rand(1.3, 2.6),
        links: []
      });
    }
    connect();
  }

  // Connect each neuron to its nearest neighbours
  function connect() {
    const maxDist = Math.min(220, Math.max(width, height) / 5);
    for (const n of neurons) {
      const near = [];
      for (const m of neurons) {
        if (m === n) continue;
        const d = Math.hypot(m.x - n.x, m.y - n.y);
        if (d < maxDist) near.push({ m, d });
      }
      near.sort((a, b) => a.d - b.d);
      n.links = near.slice(0, LINKS_PER_NEURON).map(o => o.m);
    }
  }

  function spike(n) {
    n.v = 0;
    n.refractory = REFRACTORY;
    n.glow = 1;
    for (const target of n.links) {
      pulses.push({ from: n, to: target, t: 0 });
    }
  }

  function step() {
    frame++;
    if (frame % 150 === 0) connect(); // neurons drift, so rewire now and then

    for (const n of neurons) {
      // gentle drift, wrap around edges
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
      if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;

      n.glow *= 0.94;

      if (n.refractory > 0) { n.refractory--; continue; }

      // leaky integration of noise + cursor current
      n.v = n.v * LEAK + Math.random() * NOISE * 2 * Math.random();
      if (pointer.active) {
        const d = Math.hypot(pointer.x - n.x, pointer.y - n.y);
        if (d < 140) n.v += 0.05 * (1 - d / 140);
      }
      // rare spontaneous spikes keep the network ticking over
      if (n.v >= THRESHOLD || Math.random() < 0.0012) spike(n);
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += PULSE_SPEED;
      if (p.t >= 1) {
        const target = p.to;
        if (target.refractory === 0) {
          target.v += SYNAPSE_WEIGHT;
          if (target.v >= THRESHOLD) spike(target);
        }
        pulses.splice(i, 1);
      }
    }
    // keep the network from saturating
    if (pulses.length > 600) pulses.splice(0, pulses.length - 600);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // axons
    ctx.lineWidth = 1;
    for (const n of neurons) {
      for (const m of n.links) {
        const a = 0.07 + Math.max(n.glow, m.glow) * 0.25;
        ctx.strokeStyle = `rgba(${C_LINK}, ${a})`;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
      }
    }

    // action potentials travelling down axons
    for (const p of pulses) {
      const x = p.from.x + (p.to.x - p.from.x) * p.t;
      const y = p.from.y + (p.to.y - p.from.y) * p.t;
      ctx.fillStyle = `rgba(${C_PULSE}, ${0.85 - p.t * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // cell bodies
    for (const n of neurons) {
      const charge = Math.min(n.v / THRESHOLD, 1);
      const C_FIRE = fireColor(n.x);
      if (n.glow > 0.05) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18 * n.glow + 4);
        g.addColorStop(0, `rgba(${C_FIRE}, ${0.55 * n.glow})`);
        g.addColorStop(1, `rgba(${C_FIRE}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 18 * n.glow + 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = n.glow > 0.2
        ? `rgba(${C_FIRE}, 1)`
        : `rgba(${C_REST}, ${0.35 + charge * 0.5})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + n.glow * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    step();
    draw();
    requestAnimationFrame(loop);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  // Pointer input acts like an electrode injecting current
  function setPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    pointer.x = src.clientX - rect.left;
    pointer.y = src.clientY - rect.top;
    pointer.active = true;
  }
  canvas.addEventListener("pointermove", setPointer);
  canvas.addEventListener("pointerleave", () => { pointer.active = false; });
  canvas.addEventListener("pointerdown", (e) => {
    setPointer(e);
    // a tap triggers a burst: spike every neuron near the tap
    for (const n of neurons) {
      if (n.refractory === 0 && Math.hypot(pointer.x - n.x, pointer.y - n.y) < 90) spike(n);
    }
    if (reduceMotion) draw();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) draw(); }, 150);
  });

  // Only animate while the hero is on screen and the tab is visible
  const hero = canvas.parentElement;
  let heroVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      heroVisible && !document.hidden ? start() : stop();
    }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => {
    document.hidden || !heroVisible ? stop() : start();
  });

  resize();
  if (reduceMotion) {
    // static snapshot: a few neurons shown mid-spike
    for (let i = 0; i < neurons.length; i += 7) neurons[i].glow = 0.8;
    draw();
  } else {
    // warm the network up so it's already alive on first paint
    for (let i = 0; i < 90; i++) step();
    start();
  }
})();
