const MILESTONE_INTERVAL = 500

export function calculatePoints(text: string): number {
	return 10 + text.length
}

export function getNextMilestone(points: number): number {
	if (points < MILESTONE_INTERVAL) return MILESTONE_INTERVAL
	return Math.ceil(points / MILESTONE_INTERVAL) * MILESTONE_INTERVAL
}
