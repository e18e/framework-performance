<script setup lang="ts">
import {
  galleryStyle,
  posterStyle,
  getSSRImages,
} from '../../../testdata/src/ssr-images'
</script>

<template>
  <main class="ssr-image-gallery" :style="galleryStyle">
    <img
      v-for="image in getSSRImages('webp')"
      :style="posterStyle"
      :key="image.src"
      :src="image.src"
      :alt="image.alt"
      :width="image.width"
      :height="image.height"
      :fetchpriority="image.fetchPriority"
    />
  </main>
</template>
