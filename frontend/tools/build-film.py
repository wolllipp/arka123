"""Видео-фон первого экрана (задание 4) → кадры для прокрутки в public/assets/film.

1. Пролёт камеры по реальным фото: променад → зал → окно с Библиотекой на закате.
2. Если передан клип с Мстиславом (сгенерирован от последнего кадра пролёта,
   см. prompts/04-final-scene.md) — он приклеивается в конец через растворение.

Использование (из папки frontend, нужны Pillow и ffmpeg):
    python3 tools/build-film.py "../Фото обработанное" [../generated_video.mp4]
"""
import glob, json, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageFilter

PHOTOS = sys.argv[1]
CLIP = sys.argv[2] if len(sys.argv) > 2 else None
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "film")
W, H, QUALITY = 1440, 810, 64

N = 120  # кадров пролёта
FADE = 11  # кадров растворения между сценами
# сцена: фото, кадр (центр x, центр y, ширина) в начале и в конце, диапазон кадров.
# Финал третьей сцены подогнан под кадрирование клипа — окна на стыке совпадают.
SCENES = [
    ("16.png", (836, 470, 1672), (862, 250, 560), (0, 48)),     # к жёлтым аркам зала на фасаде
    ("6.png", (836, 470, 1672), (985, 330, 760), (37, 85)),     # через зал к большому окну
    ("01.png", (610, 343, 1220), (610, 380, 867), (74, N - 1)),  # закат, Библиотека в арке (без плашки с текстом)
]

CLIP_SKIP_S = 1.125  # в начале клипа сервис «раздвоил» кота — эти кадры выбрасываем
CLIP_FPS = 16        # 24 fps клипа прореживаем: прокрутке хватает, вес меньше
CLIP_FADE = 10


def smooth(t):
    return t * t * (3 - 2 * t)


def ease_out(t):
    import math
    return math.sin(t * math.pi / 2)


def camera(im, a, b, t):
    (ax, ay, aw), (bx, by, bw) = a, b
    w = aw * (bw / aw) ** t   # экспоненциальный зум — скорость наезда ощущается постоянной
    k = (aw - w) / (aw - bw)  # центр смещается синхронно с зумом
    cx, cy, h = ax + (bx - ax) * k, ay + (by - ay) * k, w * H / W
    return im.transform((W, H), Image.EXTENT, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), Image.BICUBIC)


def flythrough():
    scenes = [(Image.open(os.path.join(PHOTOS, f)).convert("RGB"), a, b, rng) for f, a, b, rng in SCENES]
    frames = []
    for i in range(N):
        out = None
        for n, (im, a, b, (f0, f1)) in enumerate(scenes):
            if not f0 <= i <= f1:
                continue
            t = (i - f0) / (f1 - f0)
            if n == len(scenes) - 1:
                t = ease_out(min(t / 0.85, 1))  # последние ~15% кадров камера стоит
            fr = camera(im, a, b, t)
            out = fr if out is None else Image.blend(out, fr, smooth(min((i - f0) / FADE, 1)))
        frames.append(out)
    return frames


def clip_frames(path):
    tmp = tempfile.mkdtemp()
    try:
        subprocess.run(["ffmpeg", "-v", "error", "-ss", str(CLIP_SKIP_S), "-i", path, "-vf", f"fps={CLIP_FPS}", "-q:v", "2",
                        os.path.join(tmp, "c%04d.jpg")], check=True)
        for p in sorted(glob.glob(os.path.join(tmp, "c*.jpg"))):
            im = Image.open(p).convert("RGB")
            gw = round(im.width * H / im.height)
            im = im.resize((gw, H), Image.LANCZOS).crop(((gw - W) // 2, 0, (gw - W) // 2 + W, H))
            yield im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    finally:
        shutil.rmtree(tmp)


def main():
    frames = flythrough()
    if CLIP:
        last = frames[-1]
        for k, im in enumerate(clip_frames(CLIP)):
            if k < CLIP_FADE:
                im = Image.blend(last, im, smooth((k + 1) / (CLIP_FADE + 1)))
            frames.append(im)

    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    for i, im in enumerate(frames):
        im.save(os.path.join(OUT, f"f{i + 1:04d}.jpg"), quality=QUALITY, optimize=True, progressive=True)
    # screens — длина прокрутки видео в экранах (читает Hero.jsx)
    manifest = {"count": len(frames), "width": W, "height": H, "pattern": "f%04d.jpg", "screens": 3}
    with open(os.path.join(OUT, "manifest.json"), "w") as fh:
        fh.write(json.dumps(manifest) + "\n")
    size = sum(os.path.getsize(p) for p in glob.glob(os.path.join(OUT, "*.jpg"))) / 2**20
    print(f"Готово: {len(frames)} кадров, {size:.1f} МБ → {os.path.normpath(OUT)}")
    # последний кадр пролёта — стартовый кадр для генерации клипа
    frames[N - 1].save(os.path.join(os.path.dirname(OUT), "..", "..", "..", "prompts", "refs", "k3-base.jpg"), quality=90)


if __name__ == "__main__":
    main()
