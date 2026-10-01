# Tarang '26 Event Portal

Responsive front-end mini project for the annual inter-college festival of Prathyusha Engineering College.
Built with HTML5, CSS3 (responsive, media queries) and plain JavaScript (DOM manipulation). No build step, no dependencies.

## Run it

1. Unzip the folder.
2. Open `index.html` in any browser. Fonts load from Google Fonts when online and fall back to system fonts offline.

## Project structure

```
tarang-event-portal/
  index.html   Page structure: header and nav, home, events, schedule, gallery, registration, contact, footer
  style.css    Colour tokens (light and dark), layout, cards, forms, media queries at 960px, 880px and 640px
  script.js    Data, rendering, filters, validation, announcements, countdown, lightbox
  images/      One illustration per event (SVG), named after the event id
  README.md    This file
```

## Features

- Sticky navigation with a menu button on small screens, light and dark theme switch
- Home page with festival banner, live countdown, highlighted events and a notice board
- Event listings (10 events) with date, time, venue, seats left and a Register button; filter by category and day
- Day-wise schedule table that stacks into rows on phones
- An illustration for every event, shown on event cards, highlights and the gallery
- Responsive gallery with a keyboard-friendly viewer
- Registration form with required-field and format validation, duplicate check, seat count update and success message
- Contact form with validation and success message
- Organiser tools: post an announcement, change an event's venue or start time (cards and schedule update instantly)

## JavaScript concepts used

Variables, functions, conditions, arrays and objects, `addEventListener`, `querySelector`, creating and clearing DOM nodes, form validation with regular expressions, `localStorage` for saving registrations in the browser, `setInterval` for the countdown.

## Customise

- Event data, announcements and gallery captions are the arrays near the top of `script.js`.
- Colours and fonts are the variables at the top of `style.css`.
- Images: each event uses `images/<event id>.svg` (for example `images/futsal.svg`). To use real photos, save them in `images/` and change the file extension in the `imgSrc` function near the top of `script.js` (for example `.jpg`).
- Contact details are in the Contact section of `index.html`. The email and phone number are placeholders; replace them with real ones.

## Limits of this demo

Registrations and contact messages are not sent anywhere. Registrations are kept in the visitor's browser only. To collect them centrally, connect a backend or a form service.

## Hosting

Upload the folder to GitHub Pages, Netlify or any static host. The entry file is `index.html`.

## Learning outcomes covered

Semantic HTML5, forms and user input, CSS3 layout and styling, media queries, event cards, tables, navigation menus and galleries, DOM manipulation, client-side validation, dynamic content updates.
