<script lang="ts">
  import { getMessages, sendMessages } from "./chat.remote";
  import { page } from "$app/state";
  import Input from "$lib/components/input.svelte";
  import Button from "$lib/components/button.svelte";
  import Message from "$lib/components/message.svelte";
  import Error from "$lib/components/error.svelte";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let username = $derived((page.url.searchParams.get("name") || "").slice(0, 20));
  let messages = getMessages();
  let messageText = $state("");
  let messageLength = $derived(messageText.length);

  onMount(() => {
    if (username === "") {
      goto("/");
    }
  });
</script>

<div class="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
  {#if messages.current}
    {#each messages.current as message (message.id)}
      <Message sender={message.sender} {username} text={message.text} createdAt={message.createdAt} />
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
