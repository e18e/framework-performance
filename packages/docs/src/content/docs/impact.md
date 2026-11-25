---
title: Impact
description: Improvements to frameworks, routers, and documentation that came out of the Framework Performance project.
---

The Framework Performance project measures frameworks, but the comparisons also surface
concrete improvement opportunities in the frameworks themselves, their
dependencies, and their documentation. This page collects upstream changes that
came out of the project or were influenced by its output.

## TanStack

- [perf(react-router): avoid redundant link hydration updates](https://github.com/TanStack/router/pull/8435)
  avoids one hydration-triggered render per ordinary React Router link by only
  subscribing links to hydration state when their active matching compares URL
  hashes. Hash-sensitive links keep the update they need. Found while
  investigating the Framework Performance project's 1,000-link table and proposed upstream to
  TanStack Router.

## Nuxt

- [perf(nuxt): render internal `<NuxtLink>` anchors directly on server](https://github.com/nuxt/nuxt/pull/36015)
  renders internal `<NuxtLink>` anchors directly on the server instead of
  building reactive link state, cutting server render time for internal
  links by roughly 58%. Merged into Nuxt.

- [perf(link): skip reactivity when rendering on the server](https://github.com/vuejs/router/pull/2774)
  skips Vue reactivity when rendering `<RouterLink>` during SSR, making
  server-rendered links roughly 1.5-2.2x faster. Proposed upstream to Vue
  Router.

- [perf(nuxt): resolve ssr nuxt link route lazily from a prototype getter](https://github.com/nuxt/nuxt/pull/36891)
  builds the slot props of each server-rendered `<NuxtLink>` from a class
  with a prototype getter rather than an object literal with its own
  `get route()` accessor, which V8 creates about 20x more slowly. That takes
  about 12% off rendering the 1,000-link table. Merged into Nuxt and released
  in `4.7.0`.

- [perf(nuxt): render nuxt links without a component instance](https://github.com/nuxt/nuxt/pull/36904)
  compiles a template `<NuxtLink>` with a static internal `to` into a plain
  anchor in its parent's render function on the client, with shared click and
  prefetch handlers, so each link no longer needs its own component
  instance. On the client-rendered 1,000-link table this took about 14ms off
  first contentful paint in local runs. Merged into Nuxt and released in
  `4.7.0`.

- [perf(nuxt): preload matched page chunks for client-only responses](https://github.com/nuxt/nuxt/pull/36901)
  adds `modulepreload` links for the matched page's chunks to the HTML shell
  of client-only (`ssr: false`) routes, so the browser no longer waits for
  the entry to run before it discovers the page chunk. Locally that was
  worth about 25ms of first contentful paint on the client-rendered test.
  Merged into Nuxt and released in `4.7.0`.

- [perf(nuxt): transcode large non-latin1 html chunks to utf-8 with icu](https://github.com/nuxt/nuxt/pull/36892)
  is the same `→` problem as the Solid compiler fix below, solved at the
  other end: when a rendered chunk contains a character outside Latin1,
  Nuxt encodes it with `buffer.transcode` rather than V8's UTF-8 writer,
  which is about 40x slower for two-byte strings on Node 24. That makes the
  1,000-row tables 10-12% faster to render on Node 22 and 24. Node 26.8 fixed
  the slow path in V8, so it's skipped there. Merged into Nuxt and released
  in `4.7.0`.

- [perf(nuxt): reduce per-request server rendering overhead](https://github.com/nuxt/nuxt/pull/36890)
  is five small server rendering changes found by profiling the project's
  SSR routes, including skipping payload reducers for primitive values
  (similar to [sveltejs/devalue#231](https://github.com/sveltejs/devalue/pull/231),
  proposed upstream). Between them they take 5-10% off each route. Merged
  into Nuxt and released in `4.7.0`.

- A handful of smaller changes trim what the initial-load page downloads:
  no prefetch of the built-in error page chunks from the entry
  ([#36898](https://github.com/nuxt/nuxt/pull/36898), 4 requests and 5.5 kB
  on every page load), no refetch of CSS already inlined into the response
  ([#36900](https://github.com/nuxt/nuxt/pull/36900)), no idle app manifest
  fetch ([#36903](https://github.com/nuxt/nuxt/pull/36903)), no
  `modulepreload` for the entry script itself
  ([#36896](https://github.com/nuxt/nuxt/pull/36896)), no empty containers in
  the inline payload ([#36897](https://github.com/nuxt/nuxt/pull/36897)), and
  no `ofetch` or unhead in the client bundle when nothing on the client uses
  them ([#35790](https://github.com/nuxt/nuxt/pull/35790),
  [#37035](https://github.com/nuxt/nuxt/pull/37035),
  [#37243](https://github.com/nuxt/nuxt/pull/37243)). All merged into Nuxt
  and released in `4.7.0`.

On the project's CI runner, Nuxt `4.7.0` measured against `4.6.4` a day
apart:

| | `4.6.4` | `4.7.0` |
| --- | ---: | ---: |
| SSR load, 1,000 `<NuxtLink>`s, 25 connections | 134 req/s | 547 req/s |
| SSR load, 1,000 plain links, 25 connections | 321 req/s | 701 req/s |
| SSR request throughput | 311 ops/s | 413 ops/s |
| SSR first contentful paint | 85ms | 75ms |
| CSR first contentful paint | 225ms | 106ms |
| initial load | 80 kB, 14 requests | 61 kB, 3 requests |

Not all of that comes from the changes above. Several others in `4.7.0`
came from profiling a Nuxt UI site at the same time, such as encoding
rendered HTML chunk by chunk
([#36719](https://github.com/nuxt/nuxt/pull/36719)), skipping route
resolution for links that can't be active
([#36759](https://github.com/nuxt/nuxt/pull/36759)) and grouping the
modules the entry always needs into one chunk
([#36862](https://github.com/nuxt/nuxt/pull/36862)).

## Next.js

- [[Server Components] Walk parsed JSON instead of using reviver for parsing RSC payload](https://github.com/react/react/pull/35776)
  replaces the `JSON.parse` reviver used to deserialize React Server
  Components payloads with a plain parse followed by a JavaScript walk,
  making RSC payload parsing around 75% faster and speeding up rendering in
  frameworks built on top of it, including Next.js. Merged into React.

## Solid

- [perf(claims): skip URL parsing for plain hrefs in SSR link claims](https://github.com/solidjs/solid-router/pull/701)
  reads the path and query of plain root-relative hrefs without `new URL`
  when Solid Router renders links on the server. That removes two URL
  parses per link and takes the 1,000-link table from 283 to 385 requests
  per second. Merged into Solid Router and released in `2.0.0-next.43`.
- [perf(compiler): write non-ASCII SSR template text as character references](https://github.com/solidjs/solid/pull/4331)
  makes the Solid compiler write characters such as the `→` in "View →" as
  character references in server templates. One such character made V8
  store the whole rendered page as a two-byte string, which roughly doubled
  the cost of encoding the response. Rendering and encoding a 1,000-row
  table is about 1.5x faster. Merged into Solid and released in
  `2.0.0-rc.20`.
- [perf(web): build direct-call carrier shells only when a value is bound](https://github.com/solidjs/solid/pull/4333)
  stops Solid from copying every object in a server function's result when
  the function is called during server rendering and nothing in the result
  needs binding to the request. Handling a 1,000-row result goes from 0.91
  to 0.56 ms. Merged into Solid and released in `2.0.0-rc.20`.

All three were found while adding Solid 2.0 to the Framework Performance project
([#709](https://github.com/e18e/framework-performance/pull/709)). On its CI
runner, the Solid 2.0 app's SSR load test went from 170 to 280 requests per
second with one connection and from about 200 to about 390 under
concurrency after upgrading to these releases.

## SolidStart

- [docs: note future A component deprecation](https://github.com/solidjs/solid-docs/pull/1620)
  updates the Solid Router docs to note that the `<A>` component will be
  deprecated in favor of native anchors, steering developers toward better
  practices. Merged into the Solid docs.
