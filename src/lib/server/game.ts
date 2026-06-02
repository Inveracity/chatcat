const MILESTONE_INTERVAL = 500

export function calculatePoints(text: string, activeUpgradeIds: string[] = []): number {
	let points = 10 + text.length

	const ids = new Set(activeUpgradeIds)
	if (ids.has('double-time')) {
		points *= 2
	}
	if (ids.has('vowel-power')) {
		const vowels = (text.match(/[aeiou]/gi) || []).length
		points += vowels * 2
	}
	if (ids.has('per-minute')) {
		points += Math.floor(text.length * 0.1)
	}
	if (ids.has('long-word-bonus')) {
		const long = text.split(/\s+/).filter(w => w.length >= 6).length
		points += long * 10
	}

	return points
}

export function getNextMilestone(points: number): number {
	if (points < MILESTONE_INTERVAL) return MILESTONE_INTERVAL
	return Math.ceil(points / MILESTONE_INTERVAL) * MILESTONE_INTERVAL
}
