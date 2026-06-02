<script lang="ts">
  import { goto } from "$app/navigation";
  import Input from "$lib/components/input.svelte";

  let name = $state("");

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (name.trim()) {
      goto(`/chat?name=${encodeURIComponent(name.trim())}`);
    }
  }
</script>

<div class="flex-1 flex items-center justify-center">
  <form onsubmit={handleSubmit} class="w-full max-w-md px-4">
    <Input type="text" name="name" placeholder="Enter your name..." bind:value={name} />
  </form>
</div>
