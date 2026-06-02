import type { VoteState, UpgradeOption, ActiveUpgrade } from '$lib/types'

const VOTE_DURATION = 20_000
const UPGRADE_DURATION = 30_000

const TIMED_UPGRADES = new Set(['double-time', 'vowel-power', 'per-minute', 'long-word-bonus'])

const UPGRADE_POOL: UpgradeOption[] = [
	{ id: 'double-time', name: 'Double Time', description: '2× points for 30s' },
	{ id: 'vowel-power', name: 'Vowel Power', description: 'Vowels count as 2 pts each for 30s' },
	{ id: 'bonus-points', name: 'Bonus Points', description: 'Instant +200 points' },
	{ id: 'per-minute', name: 'Per Minute', description: '+0.1 pts per character for 30s' },
	{ id: 'cat-spam', name: 'Cat Spam', description: '100 "meow" messages flood into chat' },
	{ id: 'long-word-bonus', name: 'Long Word Bonus', description: 'Words ≥6 letters give +10 bonus pts for 30s' },
]

let currentVote: VoteState | null = null
let voteTimer: Timer | null = null
let notifyCallback: (() => void) | null = null
let activeUpgrades: ActiveUpgrade[] = []
let onUpgradeEffect: ((upgradeId: string) => void) | null = null
let voteOnlineCount = 0

export function setNotifyCallback(fn: () => void) {
	notifyCallback = fn
}

export function setOnUpgradeEffect(fn: (upgradeId: string) => void) {
	onUpgradeEffect = fn
}

function pickOptions(): UpgradeOption[] {
	const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5)
	return shuffled.slice(0, 3)
}

function addActiveUpgrade(upgrade: UpgradeOption) {
	const expiresAt = Date.now() + UPGRADE_DURATION
	const entry: ActiveUpgrade = { id: upgrade.id, name: upgrade.name, expiresAt }
	activeUpgrades.push(entry)
	setTimeout(() => {
		activeUpgrades = activeUpgrades.filter(u => u !== entry)
		notifyCallback?.()
	}, UPGRADE_DURATION)
}

function handleUpgradeEffect(upgrade: UpgradeOption) {
	if (TIMED_UPGRADES.has(upgrade.id)) {
		addActiveUpgrade(upgrade)
	}
	onUpgradeEffect?.(upgrade.id)
	notifyCallback?.()
}

function tallyVote(): void {
	if (!currentVote) return
	const counts: Record<number, number> = {}
	for (const idx of Object.values(currentVote.votes)) {
		counts[idx] = (counts[idx] || 0) + 1
	}
	const entries = Object.entries(counts)
	if (entries.length === 0) {
		currentVote.winner = Math.floor(Math.random() * currentVote.options.length)
	} else {
		const maxCount = Math.max(...Object.values(counts))
		const topOptions = entries.filter(([_, c]) => c === maxCount).map(([i]) => parseInt(i))
		currentVote.winner = topOptions[Math.floor(Math.random() * topOptions.length)]
	}
	currentVote.active = false

	const winningUpgrade = currentVote.options[currentVote.winner]
	handleUpgradeEffect(winningUpgrade)
}

export function startVote(onlineCount: number = 0): boolean {
	if (currentVote?.active) return false
	if (voteTimer) clearTimeout(voteTimer)
	voteOnlineCount = onlineCount
	const options = pickOptions()
	currentVote = {
		active: true,
		options,
		endsAt: Date.now() + VOTE_DURATION,
		votes: {},
		winner: null,
	}
	voteTimer = setTimeout(() => {
		if (currentVote?.active) {
			tallyVote()
		}
	}, VOTE_DURATION)
	notifyCallback?.()
	return true
}

export function castVote(sender: string, optionIndex: number): boolean {
	if (!currentVote?.active) return false
	if (currentVote.votes[sender] !== undefined) return false
	if (optionIndex < 0 || optionIndex >= currentVote.options.length) return false
	currentVote.votes[sender] = optionIndex
	if (voteOnlineCount > 0 && Object.keys(currentVote.votes).length >= voteOnlineCount) {
		clearTimeout(voteTimer!)
		tallyVote()
	}
	notifyCallback?.()
	return true
}

export function getVoteState(): VoteState | null {
	return currentVote
}

export function getActiveUpgrades(): ActiveUpgrade[] {
	return [...activeUpgrades]
}
