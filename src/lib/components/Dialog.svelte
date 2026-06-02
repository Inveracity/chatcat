<script lang="ts">
	let { open = false, children, ...rest } = $props()
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
	class="backdrop:bg-black/60 rounded-2xl p-6 w-full max-w-md bg-mocha-base shadow-2xl shadow-black/50 m-auto"
	{...rest}
>
	{@render children()}
</dialog>
