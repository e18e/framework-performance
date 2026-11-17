<script setup lang="ts">
import '../../../testdata/src/ssr-images.css'
</script>

<template>
  <main class="ssr-image-gallery">
    <img
      src="/ssr-images/BTTF1.webp"
      alt="Back to the Future poster"
      width="667"
      height="987"
    />
    <img
      src="/ssr-images/BTTF2.webp"
      alt="Back to the Future Part II poster"
      width="667"
      height="1000"
      fetchpriority="high"
    />
    <img
      src="/ssr-images/BTTF3.webp"
      alt="Back to the Future Part III poster"
      width="667"
      height="999"
    />
  </main>
</template>
