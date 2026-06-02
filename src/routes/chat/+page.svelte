<script lang="ts">
  import { getMessages, getGameState, sendMessages, vote } from "./chat.remote";
  import { page } from "$app/state";
  import Input from "$lib/components/input.svelte";
  import Button from "$lib/components/button.svelte";
  import Message from "$lib/components/message.svelte";
  import Error from "$lib/components/error.svelte";
  import Dialog from "$lib/components/Dialog.svelte";
  import { particleBurst } from "$lib/components/particleBurst";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  let username = $derived((page.url.searchParams.get("name") || "").slice(0, 20));
  let messages = getMessages();
  let gameState = getGameState();
  let messageText = $state("");
  let messageLength = $derived(messageText.length);
  let remaining = $state(0);

  let voteActive = $derived(!!gameState.current?.vote?.active);
  let voteOptions = $derived(gameState.current?.vote?.options ?? []);
  let voteEndsAt = $derived(gameState.current?.vote?.endsAt ?? 0);
  let voteVotes = $derived(gameState.current?.vote?.votes ?? {});
  let myVote = $derived(voteVotes[username]);
  let winner = $derived(gameState.current?.vote?.winner ?? null);

  $effect(() => {
    if (!voteActive) {
      remaining = 0;
      return;
    }
    const update = () => {
      remaining = Math.max(0, Math.floor((voteEndsAt - Date.now()) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  });

  let milestoneProgress = $derived.by(() => {
    const gs = gameState.current;
    if (!gs) return 0;
    const interval = 500;
    const prev = gs.nextMilestone - interval;
    return ((gs.points - prev) / interval) * 100;
  });

  onMount(() => {
    if (username === "") {
      goto("/");
    }
  });
</script>

<Dialog open={voteActive && winner === null}>
  {#if voteActive && winner === null}
    <h2 class="text-lg font-bold text-mocha-text mb-2">Milestone reached! Pick an upgrade</h2>
    <p class="text-sm text-mocha-overlay-1 mb-4">Vote ends in {remaining}s</p>
    <form {...vote} method="POST" class="flex flex-col gap-3">
      <Input type="hidden" name="sender" value={username} />
      {#each voteOptions as option, i}
        <button
          type="submit"
          name="optionIndex"
          value={i}
          disabled={myVote !== undefined}
          class="flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors
            {myVote === i
              ? 'border-mocha-mauve bg-mocha-mauve/10'
              : 'border-mocha-surface-2 hover:border-mocha-overlay-0 bg-mocha-surface-0'}
            disabled:cursor-not-allowed"
        >
          <span class="font-semibold text-mocha-text">{option.name}</span>
          <span class="text-sm text-mocha-overlay-1">{option.description}</span>
          <span class="text-xs text-mocha-overlay-0">{Object.values(voteVotes).filter(v => v === i).length} vote(s)</span>
        </button>
      {/each}
    </form>
  {/if}
</Dialog>

<Dialog open={winner != null}>
  {#if winner != null}
    <h2 class="text-lg font-bold text-mocha-green mb-2">Upgrade active!</h2>
    <p class="text-mocha-text">{voteOptions[winner]?.name} — {voteOptions[winner]?.description}</p>
  {/if}
</Dialog>

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
      <span class="text-xs text-mocha-overlay-0">Messages sent</span>
      <span class="text-3xl font-bold text-mocha-mauve">{gameState.current?.messages ?? 0}</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-mocha-overlay-0">Characters sent</span>
      <span class="text-3xl font-bold text-mocha-sapphire">{gameState.current?.characters ?? 0}</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-mocha-overlay-0">Points</span>
      <span class="text-3xl font-bold text-mocha-green">{gameState.current?.points ?? 0}</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-mocha-overlay-0">Next milestone</span>
      <span class="text-lg font-bold text-mocha-peach">{gameState.current?.nextMilestone ?? 500}</span>
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-mocha-overlay-0 mb-1">Progress</span>
      <div class="h-2 w-full rounded-full bg-mocha-surface-2 overflow-hidden">
        <div
          class="h-full rounded-full bg-mocha-mauve transition-all duration-300"
          style="width: {Math.min(milestoneProgress, 100)}%"
        ></div>
      </div>
    </div>
  </aside>
</div>
