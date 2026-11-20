<script setup lang="ts">
import '../../../testdata/src/ssr-images.css'
</script>

<template>
  <main class="ssr-image-gallery">
    <NuxtImg
      src="/ssr-images/BTTF1.jpg"
      alt="Back to the Future poster"
      width="667"
      height="987"
      format="jpeg"
      loading="eager"
    />
    <NuxtImg
      src="/ssr-images/BTTF2.jpg"
      alt="Back to the Future Part II poster"
      width="667"
      height="1000"
      format="jpeg"
      loading="eager"
      fetchpriority="high"
    />
    <NuxtImg
      src="/ssr-images/BTTF3.jpg"
      alt="Back to the Future Part III poster"
      width="667"
      height="999"
      format="jpeg"
      loading="eager"
    />
  </main>
</template>
