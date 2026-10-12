#!/usr/bin/env bash
# Видео с Мстиславом → кадры для прокрутки на сайте (задание 4).
# Использование: ./tools/film-to-frames.sh путь/к/hero-film.mp4 [число_кадров=180] [ширина=1440]
# Кладёт кадры f0001.jpg… и manifest.json в public/assets/film/. Нужен ffmpeg (brew install ffmpeg).
set -euo pipefail

IN="${1:?укажите видео: ./tools/film-to-frames.sh hero-film.mp4}"
FRAMES="${2:-180}"
WIDTH="${3:-1440}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/assets/film"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
FPS=$(python3 -c "print(round($FRAMES / $DUR, 4))")

rm -rf "$OUT" && mkdir -p "$OUT"
# -q:v 9 — JPEG ~70 КБ на кадр в 1440 px: 180 кадров ≈ 13 МБ, на экране разницы с q5 почти нет
ffmpeg -v error -i "$IN" -vf "fps=$FPS,scale=$WIDTH:-2:flags=lanczos" -q:v 9 "$OUT/f%04d.jpg"

COUNT=$(ls "$OUT"/f*.jpg | wc -l | tr -d ' ')
IFS=x read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$OUT/f0001.jpg")
printf '{ "count": %s, "width": %s, "height": %s, "pattern": "f%%04d.jpg" }\n' "$COUNT" "$W" "$H" > "$OUT/manifest.json"

echo "Готово: $COUNT кадров ${W}×${H}, $(du -sh "$OUT" | cut -f1) → $OUT"
