import type { TransitionConfig } from 'svelte/transition';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

export function particleBurst(node: Element, params: { duration?: number; particleCount?: number } = {}): TransitionConfig {
  const duration = params.duration ?? 1000;
  const particleCount = params.particleCount ?? 80;

  const el = node.firstElementChild as HTMLElement | null;
  if (!el) return { duration: 0 };

  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return { duration: 0 };

  const style = getComputedStyle(el);
  const bgColor = style.backgroundColor;
  const textColor = style.color;

  // Capture background to offscreen canvas for pixel sampling
  const offscreen = document.createElement('canvas');
  offscreen.width = rect.width;
  offscreen.height = rect.height;
  const offCtx = offscreen.getContext('2d')!;

  offCtx.fillStyle = bgColor;
  offCtx.beginPath();
  offCtx.roundRect(0, 0, rect.width, rect.height, 16);
  offCtx.fill();

  // Sample background pixels
  const img = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const pix = img.data;
  const particles: Particle[] = [];
  const total = offscreen.width * offscreen.height;
  const step = Math.max(4, Math.floor(total / particleCount) * 4);

  for (let i = 0; i < pix.length && particles.length < particleCount; i += step) {
    if (pix[i + 3] > 128) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 4;
      particles.push({
        x: (i / 4) % offscreen.width,
        y: Math.floor((i / 4) / offscreen.width),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2,
        size: 1.5 + Math.random() * 2.5,
        color: `rgb(${pix[i]},${pix[i + 1]},${pix[i + 2]})`,
        alpha: 1,
      });
    }
  }

  // Sprinkle text-colored particles
  const textParticleCount = Math.floor(particleCount * 0.2);
  for (let i = 0; i < textParticleCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 4;
    particles.push({
      x: Math.random() * offscreen.width,
      y: Math.random() * offscreen.height,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 2,
      size: 1 + Math.random() * 2,
      color: textColor,
      alpha: 1,
    });
  }

  // Create display canvas overlaid on the message element
  const canvas = document.createElement('canvas');
  canvas.width = offscreen.width;
  canvas.height = offscreen.height;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:999';
  const ctx = canvas.getContext('2d')!;

  const origPosition = el.style.position;
  el.style.position = 'relative';
  el.appendChild(canvas);

  let start: number | null = null;
  const gravity = 0.15;
  const friction = 0.97;

  function animate(time: number) {
    if (!start) start = time;
    const elapsed = time - start;
    const t = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= friction;
      p.vy *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1 - t * (0.5 + Math.random() * 0.5);

      if (p.alpha > 0) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    if (elapsed < duration) requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  return {
    duration,
    css: (t: number) => `opacity: ${t}`,
  };
}
