# Flipo

A minimal flip clock with a built-in Pomodoro timer. No dependencies, no build tools — just HTML, CSS, and JavaScript.

## Features

- **Flip Clock** — 12-hour format with AM/PM, realistic 3D flip animation
- **Pomodoro Timer** — Focus, Short Break, and Long Break modes
- **Configurable Durations** — adjust timer lengths from the settings panel
- **Task Tracking** — optionally name what you're working on before each focus session
- **Daily Dashboard** — view completed sessions, total focus time, and break time
- **LocalStorage Persistence** — settings and session history survive page reloads
- **Responsive** — adapts to any screen size, desktop or mobile
- **Auto-hide Menu** — hover (desktop) or tap (mobile) to reveal controls

## Getting Started

Open `index.html` in any modern browser. No server required.

```
git clone <repo-url>
cd flipclock
open index.html
```

## Usage

Hover over the bottom of the screen to reveal the menu:

| Section | Controls |
|---------|----------|
| Left | Clock mode |
| Center | Focus / Short Break / Long Break / Reset |
| Right | Dashboard / Settings |

### Pomodoro Workflow

1. Click **Focus** — enter an optional task name, then the timer starts
2. When done, click **Short Break** or **Long Break**
3. Click **Dashboard** to review your sessions for the day
4. Click **Settings** to adjust timer durations

## File Structure

```
index.html   — Single page app markup
style.css    — All styles (flip cards, menu, modals, dashboard)
app.js       — Clock, timer, Pomodoro logic, localStorage
```

## Tech Stack

- Vanilla HTML / CSS / JavaScript
- [Oswald](https://fonts.google.com/specimen/Oswald) (digits) and [Inter](https://fonts.google.com/specimen/Inter) (UI) from Google Fonts
- CSS animations with 3D transforms for the flip effect
- LocalStorage for persistence

## Browser Support

Any modern browser (Chrome, Firefox, Safari, Edge).

## License

MIT

---

Made in Kunnamkulam, Kerala.

[github.com/sajinct](https://github.com/sajinct)
