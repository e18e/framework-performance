<script setup lang="ts">
import '../../../testdata/src/ssr-images.css'
</script>

<template>
  <main class="ssr-image-gallery">
    <NuxtImg
      src="/ssr-images/BTTF1.webp"
      alt="Back to the Future poster"
      width="667"
      height="987"
      format="webp"
      loading="eager"
    />
    <NuxtImg
      src="/ssr-images/BTTF2.webp"
      alt="Back to the Future Part II poster"
      width="667"
      height="1000"
      format="webp"
      loading="eager"
      fetchpriority="high"
    />
    <NuxtImg
      src="/ssr-images/BTTF3.webp"
      alt="Back to the Future Part III poster"
      width="667"
      height="999"
      format="webp"
      loading="eager"
    />
  </main>
</template>
