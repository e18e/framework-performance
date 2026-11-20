<script lang="ts">
  import '../../../../testdata/src/ssr-images.css'
</script>

<main class="ssr-image-gallery">
  <enhanced:img
    src="../../lib/assets/ssr-images/BTTF1.webp"
    alt="Back to the Future poster"
    loading="eager"
  />
  <enhanced:img
    src="../../lib/assets/ssr-images/BTTF2.webp"
    alt="Back to the Future Part II poster"
    loading="eager"
    fetchpriority="high"
  />
  <enhanced:img
    src="../../lib/assets/ssr-images/BTTF3.webp"
    alt="Back to the Future Part III poster"
    loading="eager"
  />
</main>
