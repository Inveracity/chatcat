<script lang="ts">
  import { MESSAGE_TTL } from "$lib";

  interface Props {
    username: string;
    sender: string;
    text: string;
    createdAt: number;
  }

  let { sender, username, text, createdAt }: Props = $props();

  let remaining = $state(0);
  let showTimer = $state(false);

  $effect(() => {
    remaining = Math.max(0, MESSAGE_TTL - (Date.now() - createdAt));
    showTimer = remaining > 0;
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      remaining = Math.max(0, MESSAGE_TTL - (Date.now() - createdAt));
      if (remaining <= 0) {
        showTimer = false;
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div
  class="max-w-[90%] md:max-w-[80%] min-w-0 sm:min-w-96 rounded-2xl px-3 py-2 md:px-4 md:py-3 leading-relaxed text-wrap {sender === username
    ? 'self-end bg-mocha-mauve text-mocha-base'
    : 'self-start bg-mocha-surface-0 text-mocha-text'}"
>
  <p class="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">{sender}</p>
  <p>{text}</p>
  {#if showTimer}
    <p class="mt-1 text-right text-xs opacity-50">
      disappears in {Math.ceil(remaining / 1000)}s
    </p>
  {/if}
</div>
