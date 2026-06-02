<script lang="ts">
  import { getMessages, getMessageCount, sendMessages } from "./chat.remote";
  import { page } from "$app/state";
  import Input from "$lib/components/input.svelte";
  import Button from "$lib/components/button.svelte";
  import Message from "$lib/components/message.svelte";
  import Error from "$lib/components/error.svelte";
  import { particleBurst } from "$lib/components/particleBurst";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let username = $derived((page.url.searchParams.get("name") || "").slice(0, 20));
  let messages = getMessages();
  let messageCount = getMessageCount();
  let messageText = $state("");
  let messageLength = $derived(messageText.length);

  onMount(() => {
    if (username === "") {
      goto("/");
    }
  });
</script>

<div class="flex flex-1 flex-row min-h-0">
  <div class="flex flex-col flex-1 min-w-0">
    <div class="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
      {#if messages.current}
        {#each messages.current as message (message.id)}
          <div out:particleBurst class="flex flex-col">
            <Message sender={message.sender} {username} text={message.text} createdAt={message.createdAt} />
          </div>
        {/each}
      {:else}
        <p class="mt-12 text-center text-mocha-overlay-1">No messages yet. Say hello!</p>
      {/if}
    </div>

    <div class="px-2 shrink-0">
      <form {...sendMessages} class="mb-6 flex gap-3">
        <Input type="hidden" name="sender" placeholder="username" bind:value={username} />
        <Input name="text" placeholder="message" type="text" bind:value={messageText} required />
        <Button>{messageLength === 0 ? "send" : messageLength}</Button>
      </form>

      {#each sendMessages.fields.text.issues() as issue}
        <Error>
          {issue.message}
        </Error>
      {/each}
    </div>
  </div>

  <aside class="w-60 shrink-0 border-l border-mocha-surface-2 p-4 flex flex-col gap-4">
    <h2 class="text-sm font-semibold uppercase tracking-wider text-mocha-overlay-1">Stats</h2>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-mocha-overlay-0">Total messages sent</span>
      <span class="text-3xl font-bold text-mocha-mauve">{messageCount.current ?? 0}</span>
    </div>
  </aside>
</div>
