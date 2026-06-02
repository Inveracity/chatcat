export interface Stats {
	messages: number
	characters: number
	points: number
}

export interface UpgradeOption {
	id: string
	name: string
	description: string
}

export interface VoteState {
	active: boolean
	options: UpgradeOption[]
	endsAt: number
	votes: Record<string, number>
	winner: number | null
}

export interface ActiveUpgrade {
	id: string
	name: string
	expiresAt: number
}

export interface GameState {
	messages: number
	characters: number
	points: number
	nextMilestone: number
	vote: VoteState | null
	activeUpgrades: ActiveUpgrade[]
}
