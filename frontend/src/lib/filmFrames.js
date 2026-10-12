/* Видео-фон на скролле в стиле Apple: кадры видео как картинки, рисуются на canvas
   в зависимости от прокрутки. Видео-файл так не умеет — перемотка <video> рывками
   и зависит от кодека; кадры дают ровный «скраб» в любом браузере. */

/** Порядок загрузки: первый и последний кадр, затем шаг 16 → 8 → 4 → 2 → 1 — прокрутка работает сразу */
function loadOrder(count) {
  const order = [0, count - 1];
  const seen = new Set(order);
  for (let step = 16; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

export async function loadManifest(base = "/assets/film") {
  try {
    const res = await fetch(`${base}/manifest.json`, { cache: "no-cache" });
    if (!res.ok) return null;
    const m = await res.json();
    return m.count > 1 ? { ...m, base } : null;
  } catch {
    return null;
  }
}

/** Плеер кадров: draw(progress 0..1) рисует ближайший загруженный кадр, cover-вписыванием */
export function createFilmPlayer(canvas, manifest, onFirstFrame) {
  const { count, base, pattern = "f%04d.jpg" } = manifest;
  const frames = new Array(count);
  const ctx = canvas.getContext("2d");
  let wanted = 0;
  let disposed = false;

  const src = (i) => `${base}/${pattern.replace("%04d", String(i + 1).padStart(4, "0"))}`;

  // грузим по 6 параллельно, в порядке loadOrder
  const queue = loadOrder(count);
  let active = 0;
  const pump = () => {
    while (!disposed && active < 6 && queue.length) {
      const i = queue.shift();
      const img = new Image();
      img.decoding = "async";
      active++;
      img.onload = () => {
        active--;
        frames[i] = img;
        if (i === 0) onFirstFrame?.();
        if (Math.abs(i - wanted) < 3 || i === 0) draw(wanted / (count - 1));
        pump();
      };
      img.onerror = () => {
        active--;
        pump();
      };
      img.src = src(i);
    }
  };
  pump();

  function nearest(i) {
    for (let d = 0; d < count; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw(wanted / (count - 1));
  }

  function draw(progress) {
    wanted = Math.round(Math.min(1, Math.max(0, progress)) * (count - 1));
    const img = nearest(wanted);
    if (!img || !canvas.width) return;
    // cover: заполняем canvas без полей, обрезая лишнее по центру
    const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return {
    draw,
    dispose() {
      disposed = true;
      ro.disconnect();
    },
  };
}
