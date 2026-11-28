We're using the Mastro web framework.

- Use web search with `site:mastrojs.github.io` to look up Mastro docs.
- Use web search with `site:developer.mozilla.org` to look up web platform
  features (or the [modern-web-guidance](https://developer.chrome.com/docs/modern-web-guidance) skills).
  Use web APIs if they are "Baseline Widely available".
- Write semantic HTML.
- CSS
  - Never add inline CSS
  - Avoid adding classes if you can use HTML element selectors
  - Use a [two-layer approach](https://theadminbar.com/semantics-and-primitives-color-system/)
    for CSS variables (primitives like `--blue: #0000ff`,
    and semantics like `--link-color: var(--blue)`).
  - Ask the user whether they want to only have a single global
    [styles.css](routes/styles.css) file (good for smaller projects),
    or whether they want to colocate CSS files with their HTML
    in [components](components/) and if so
    [which approach they prefer](https://mastrojs.github.io/blog/2026-05-26-component-scoped-css-without-build-step/)
- Only use [client-side JavaScript](https://mastrojs.github.io/guide/interactivity-with-javascript-in-the-browser/)
  if absolutely necessary. If so, use `<script type="module">`.
