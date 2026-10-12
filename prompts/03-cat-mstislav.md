# Мстислав — фирменный персонаж АРКА 123 (задания 2 и 4)

## Идея (текст для сдачи)

**Мстислав — серый кот, хранитель зала напротив Библиотеки.**

Коты веками жили в библиотеках и берегли книги — это настоящая традиция. Мстислав продолжает её на другой стороне улицы: он живёт в АРКЕ 123, встречает гостей у арки, провожает в зал и греется на подоконнике огромного арочного окна, за которым — Национальная библиотека. Имя — от улицы Мстиславца: Пётр Мстиславец был первопечатником, соратником Ивана Фёдорова, так что у кота «книжная» родословная.

Почему кот: он сразу передаёт уют и спокойствие — то, что важно людям, которые проводят мастер-классы и лекции. Дымчато-серая шерсть повторяет графит стен, янтарные глаза — тёплый свет заката в арках, на графитовом шейном платке — золотая брошь со знаком «123». Характер — спокойный хозяин, а не игривый котёнок: неторопливый, внимательный, чуть важный.

---

## Библия персонажа (вставлять в начало каждого промта)

> **Mstislav**, a calm, dignified adult male cat. Solid smoky-grey short dense coat with a faint silver sheen, NO stripes, NO white patches (like a Russian Blue / Chartreux mix). Round amber-gold eyes. Slightly broad face, neat whiskers. Wears a soft graphite-navy (#213443) silk neckerchief tied loosely at the neck; pinned on it — a small polished gold enamel brooch shaped like an arched doorway outline with the numbers "123" inside (reference image attached). Calm, confident, a little regal, never cartoonish. Photorealistic, premium editorial photography, soft natural light, shallow depth of field, Apple-advertising mood: lots of negative space, warm sunset accents, graphite and cream palette.

**Неизменно во всех кадрах:** однотонный дымчато-серый, без полос и пятен · янтарные глаза · графитовый платок · золотая брошь-арка «123» · спокойная поза.

**Референсы, которые прикладывать:** `2.png` (знак — для броши), фото зала из `Фото обработанное/` (указаны в каждом промте).

---

## Шаг 1. Лист персонажа (обязательно первым)

Сервис: Nano Banana (Gemini) или Midjourney v7 (`--cref` нельзя без первого кадра — сначала получите один удачный, потом используйте его как референс).

> [Библия персонажа]
> Character reference sheet on a plain warm cream background (#F4F0E8), even soft studio light. Five views of the SAME cat in a row: 1) front, sitting upright, looking at camera; 2) three-quarter view, sitting; 3) side profile, standing; 4) walking, side view mid-stride; 5) lying on a windowsill, relaxed, tail wrapped. Plus a close-up inset of the gold arch-shaped "123" brooch on the graphite neckerchief. Consistent proportions, identical coat colour and markings in every view. No text except the brooch. 16:9.

Сгенерируйте 4 варианта, выберите один и дальше **всегда прикладывайте его как референс персонажа**. Сохраните как `character-sheet.png`.

## Шаг 2. Портрет для сайта (статичный персонаж, задание 2)

> [Библия персонажа]
> Using the attached hall photo as the exact background (do not change the room, windows, floor or the view), place Mstislav sitting upright on the wide dark windowsill of the large arched window, three-quarter view, turned slightly toward the camera, calm amber eyes looking into the lens. Golden-hour sunlight through the window rims his grey fur with a warm glow; the National Library of Belarus (the diamond-shaped glass building) is visible through the window behind him. Brooch clearly visible. Vertical 4:5, cat occupies the lower-middle third, generous space above.

Референсы: `character-sheet.png`, `Фото обработанное/7.png` (окно с Библиотекой). Сохраните лучший как **`mstislav-portrait.jpg`** (≥ 1600 px по длинной стороне).

## Шаг 3. Ключевые кадры для видео (задание 4)

Видео собирается из 3 клипов по 5 с, сцена к сцене без склеек: **последний кадр клипа N — первый кадр клипа N+1**. Первые кадры делаем картинками на реальных фото зала — так помещение не искажается.

| Кадр | На каком фото | Промт (после библии персонажа) |
|---|---|---|
| **K1** | `16.png` (променад и арочные окна фасада) | Mstislav sits on the warm paving stones of the promenade in front of the building's arched ground-floor windows, facing the camera, morning light. Do not alter the architecture. 16:9. |
| **K2** | `6.png` (пустой зал, два арочных окна) | Mstislav walks across the herringbone oak floor of the empty hall toward the large arched windows, seen from behind at floor level, tail up, soft daylight. Do not alter the room. 16:9. |
| **K3** | `01.png` (закат в арках, Библиотека) | Mstislav sits on the windowsill of the left arched window at sunset, back to the camera, looking at the National Library; warm rim light on his fur. Do not alter the room or the view. 16:9. |

## Шаг 4. Клипы (Kling 2.x / Veo 3 / Runway, image-to-video, 5 с, 16:9, 24–30 fps)

Общие требования к каждому клипу: **камера движется плавно и только вперёд или вбок, без резких поворотов и склеек; без звука; кот остаётся тем же, брошь видна; помещение не меняется.**

1. **Клип 1 — встреча у арки.** Старт: K1. *«The cat looks up at the camera, slowly blinks, stands and walks calmly toward the arched entrance of the building; the camera follows at cat height with a slow forward dolly. Ends as the cat steps into the arch.»*
2. **Клип 2 — через зал.** Старт: последний кадр клипа 1 → лучше K2. *«The cat walks across the empty hall toward the big arched windows, sunlight patches shaped like arches on the floor; slow tracking shot behind the cat at floor level, gently rising.»* Конечный кадр: K3 (если сервис поддерживает start + end frame — задайте K3 концом).
3. **Клип 3 — у окна.** Старт: K3. *«The cat jumps softly onto the windowsill, sits, looks at the National Library across the street, then turns his head to the camera and slowly blinks. The camera slowly pushes in and settles. Final 1 second is almost still.»* — последний кадр почти статичен: им заканчивается прокрутка.

Сохраните клипы как `clip1.mp4`, `clip2.mp4`, `clip3.mp4` и склейте (или пришлите мне — склею и выровняю цвет).

## Шаг 5. В сайт

```bash
cd frontend
./tools/film-to-frames.sh ~/путь/к/hero-film.mp4     # видео → кадры для прокрутки
cp ~/путь/к/mstislav-portrait.jpg public/assets/character/mstislav-portrait.jpg
```

Скрипт кладёт кадры в `public/assets/film/` и пишет `manifest.json`. Сайт сам подхватит видео-фон и портрет; пока файлов нет — показывается прежнее фото.
