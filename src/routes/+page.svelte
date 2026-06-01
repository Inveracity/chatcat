<script lang="ts">
  import { onMount } from "svelte";
  import { getMessages, sendMessages } from "./chat.remote";
  let username = "User";
  onMount(() => {
    const names = ["John", "Sigourney", "Hasha", "Sibhoan", "Kevon", "Devin", "Guest"];

    const random = Math.floor(Math.random() * names.length);
    username = names[random];
  });
  let messages = getMessages();
</script>

<div class="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
  <form {...sendMessages} class="mb-6 flex gap-3">
    <input type="hidden" name="sender" value={username} />
    <input
      type="text"
      name="text"
      required
      placeholder="Type a message..."
      class="min-w-0 flex-1 rounded-xl bg-mocha-surface-0 px-4 py-3 text-mocha-text outline-none placeholder:text-mocha-overlay-2 focus:ring-2 focus:ring-mocha-mauve"
    />
    <button
      class="cursor-pointer rounded-xl bg-mocha-mauve px-5 py-3 font-semibold text-mocha-base transition-colors hover:bg-mocha-pink active:bg-mocha-mauve"
    >
      Send
    </button>
  </form>

  <div class="flex flex-col gap-3 overflow-y-auto">
    {#if messages.current}
      {#each messages.current as message (message.id)}
        <div
          class="max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed {message.sender === 'User'
            ? 'self-end bg-mocha-mauve text-mocha-base'
            : 'self-start bg-mocha-surface-0 text-mocha-text'}"
        >
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">{message.sender}</p>
          <p>{message.text}</p>
        </div>
      {/each}
    {:else}
      <p class="mt-12 text-center text-mocha-overlay-1">No messages yet. Say hello!</p>
    {/if}
  </div>
</div>
