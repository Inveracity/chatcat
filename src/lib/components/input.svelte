<script lang="ts">
  interface Props {
    type: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    value?: string;
  }

  let { type, name, required, placeholder, value = $bindable() }: Props = $props();
</script>

<input
  {type}
  {name}
  {required}
  {placeholder}
  bind:value
  autocomplete="off"
  class="min-w-0 flex-1 rounded-xl bg-mocha-surface-0 px-4 py-3 text-mocha-text outline-none placeholder:text-mocha-overlay-2 focus:ring-2 focus:ring-mocha-mauve"
/>
