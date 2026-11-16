<script lang="ts">
  import {
    galleryStyleText,
    getSSRImages,
    posterStyleText,
  } from '../../../../testdata/src/ssr-images'
</script>

<main class="ssr-image-gallery" style={galleryStyleText}>
  {#each getSSRImages('jpeg') as { fetchPriority, ...image } (image.src)}
    <img style={posterStyleText} {...image} fetchpriority={fetchPriority} />
  {/each}
</main>
