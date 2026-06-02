<script lang="ts">
  let { children } = $props();
</script>

<button
  class="cursor-pointer min-w-20 rounded-xl bg-mocha-mauve px-5 py-3 font-semibold text-mocha-base font-mono transition-colors hover:bg-mocha-pink active:bg-mocha-mauve"
>
  {@render children()}
</button>
