# Финальная сцена видео-фона: Мстислав у окна (задание 4)

Пролёт камеры «променад → зал → окно на закате» собран из фото. Он заканчивается кадром `prompts/refs/k3-base.jpg`. Генерация продолжает видео с этого кадра: кот запрыгивает на подоконник, смотрит на Библиотеку, оборачивается к зрителю. **Камера всё время стоит**, иначе будет скачок на стыке с пролётом.

Нужно: 1 картинка + 1–2 клипа.

---

## Шаг 1. Картинка: кот на подоконнике (Nano Banana / Gemini)

Приложить: `prompts/refs/k3-base.jpg` (фон), `prompts/refs/mstislav-ref.jpg` (кот).

> Edit the first image (the room with the arched window). Keep the room, the window, the frame, the windowsill, the radiator, the view and the lighting EXACTLY as they are, pixel for pixel; same framing and camera position, do not crop, zoom or extend. Add only one thing: the cat from the second image. He sits on the dark windowsill in the middle of the window, slightly left of center, seen from behind in three-quarter view, looking out at the diamond-shaped glass library building across the street. Calm, upright, dignified pose, tail wrapped neatly along the windowsill. Solid smoky-grey short dense coat, uniform colour everywhere, the tail the same grey as the body, no stripes, no white patches. Navy-blue collar, the small arch-shaped silver tag with "123" is visible at the side of the neck. Warm golden sunset light from the window rims his fur with a thin glowing outline; his shadow falls softly onto the windowsill toward the camera. The cat is realistically sized for the window (about one fifth of the window's width). Photorealistic, same photo style and grain as the background. 16:9.

Сделать 4 варианта и выбрать тот, где **комната не изменилась** (сравнить с `k3-base.jpg`: рамы, батарея, Библиотека на месте), а кот похож на референс. Сохранить как `k3-cat.jpg`.

---

## Шаг 2. Клип 1: кот запрыгивает на подоконник

Сервис: **Kling 2.x** (режим *Start & End frame*) или **Veo 3.1** (*First and last frame*). 16:9, 5 с, 1080p, без звука.

- Начальный кадр: `prompts/refs/k3-base.jpg` (пустой подоконник)
- Конечный кадр: `k3-cat.jpg`

> Locked-off static camera, absolutely no camera movement, no zoom, no pan. A calm grey cat enters the frame from the bottom, leaps gracefully onto the windowsill in one smooth jump, lands softly, turns and settles into a sitting position, facing the window and looking at the library outside. Slow, smooth, natural cat movement. The room, the window and the view stay perfectly still and unchanged. Warm golden sunset light. Photorealistic. No text, no extra objects, no other animals, no people.

Negative prompt (если есть поле): `camera movement, zoom, shaky camera, cuts, morphing, room changes, extra cats, stripes, white patches, text, watermark`

---

## Шаг 3. Клип 2: оборачивается и моргает (финал прокрутки)

Тот же сервис, режим *image-to-video* (только начальный кадр). 16:9, 5 с.

- Начальный кадр: `k3-cat.jpg` (или последний кадр клипа 1)

> Locked-off static camera, no camera movement. The grey cat sits calmly on the windowsill looking at the library at sunset. After a moment he slowly turns his head over his shoulder toward the camera, looks into the lens with amber eyes and slowly blinks once, a friendly "cat smile". Then he stays still. Very slow, gentle, minimal motion, the last second is almost a still frame. Golden light softly glows on his fur, the room and the view do not change. Photorealistic. No text.

---

## Шаг 4. Проверка перед отправкой

- первый кадр клипа 1 совпадает с `k3-base.jpg`, без вспышки и смены цвета;
- камера не двигается ни в одном клипе;
- кот один и тот же: однотонный серый хвост, без полос, ошейник с кулоном виден;
- окно, батарея и Библиотека не «плывут».

Генерировать по 3–4 варианта и брать лучший, в максимальном разрешении (минимум 1080p).

## Шаг 5. В сайт

```bash
cd frontend
python3 tools/build-film.py "../Фото обработанное" ../generated_video.mp4
```

Скрипт рендерит пролёт, приклеивает клип через растворение и кладёт кадры в `public/assets/film/`. В текущем клипе первая секунда с «раздвоенным» котом выбрасывается (`CLIP_SKIP_S`); для нового клипа это значение и кадрирование финала (`SCENES`) нужно проверить.
