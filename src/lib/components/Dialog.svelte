<script lang="ts">
	let { open = false, children } = $props()
	let dialog: HTMLDialogElement

	$effect(() => {
		if (open) {
			if (!dialog.open) dialog.showModal()
		} else {
			if (dialog.open) dialog.close()
		}
	})
</script>

<dialog
	bind:this={dialog}
	class="backdrop:bg-black/60 rounded-2xl p-6 w-full max-w-md"
>
	{@render children()}
</dialog>
