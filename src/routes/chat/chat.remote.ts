import * as v from 'valibot'
import { query, form } from '$app/server';
import { MESSAGE_TTL } from '$lib';
import { getStats, incrementStats } from '$lib/server/db';
import { calculatePoints, getNextMilestone } from '$lib/server/game';
import { setNotifyCallback, setOnUpgradeEffect, startVote, castVote, getVoteState, getActiveUpgrades } from '$lib/server/voting';
import type { GameState } from '$lib/types';

interface Message {
	id: number
	sender: string
	text: string
	createdAt: number
}

const messages: Message[] = [];
const listeners = new Set<any>();

const onlineUsers = new Map<string, number>();
const PRESENCE_TIMEOUT = 15_000;

let id = 1;

setInterval(() => {
	const now = Date.now();
	let changed = false;
	for (const [name, lastSeen] of onlineUsers) {
		if (now - lastSeen > PRESENCE_TIMEOUT) {
			onlineUsers.delete(name);
			changed = true;
		}
	}
	if (changed) notify();
}, 5_000);

function getOnlineUsers(): string[] {
	const now = Date.now();
	for (const [name, lastSeen] of onlineUsers) {
		if (now - lastSeen > PRESENCE_TIMEOUT) {
			onlineUsers.delete(name);
		}
	}
	return [...onlineUsers.keys()];
}

function notify() {
	for (const listener of listeners) listener();
	listeners.clear();
}

setNotifyCallback(notify);

setOnUpgradeEffect((upgradeId) => {
	if (upgradeId === 'bonus-points') {
		incrementStats(0, 200);
	} else if (upgradeId === 'cat-spam') {
		for (let i = 0; i < 100; i++) {
			const msg: Message = { id: id++, sender: '🐱', text: 'meow', createdAt: Date.now() };
			messages.push(msg);
			scheduleRemove(msg, MESSAGE_TTL);
		}
	}
	notify();
});

export const getMessages = query.live(async function* () {
	while (true) {
		yield messages;
		const { promise, resolve } = Promise.withResolvers();
		listeners.add(resolve);
		await promise;
	}
});

export const presence = form(
	v.object({
		username: v.pipe(v.string(), v.minLength(1)),
	}),
	async ({ username }) => {
		onlineUsers.set(username, Date.now());
		notify();
	}
)

export const getGameState = query.live(async function* () {
	while (true) {
		const stats = getStats();
		const vote = getVoteState();
		const state: GameState = {
			messages: stats.messages,
			characters: stats.characters,
			points: stats.points,
			nextMilestone: getNextMilestone(stats.points),
			vote: vote && vote.active ? vote : null,
			activeUpgrades: getActiveUpgrades(),
			onlineUsers: getOnlineUsers(),
		}
		yield state;
		const { promise, resolve } = Promise.withResolvers();
		listeners.add(resolve);
		await promise;
	}
});

function scheduleRemove(msg: Message, ms: number) {
	setTimeout(() => {
		const idx = messages.indexOf(msg);
		if (idx !== -1) {
			messages.splice(idx, 1);
			notify();
		}
	}, ms);
}

export const sendMessages = form(
	v.object({
		text: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
		sender: v.pipe(v.string(), v.minLength(1), v.maxLength(1000))
	}),
	async ({ sender, text }) => {
		const stats = getStats();
		const oldPoints = stats.points;
		const activeUpgrades = getActiveUpgrades();
		const points = calculatePoints(text, activeUpgrades.map(u => u.id));
		incrementStats(text.length, points);
		const newPoints = oldPoints + points;

		if (Math.floor(oldPoints / 500) < Math.floor(newPoints / 500)) {
			startVote(getOnlineUsers().length);
		}

		const msg: Message = { id: id++, sender, text, createdAt: Date.now() };
		messages.push(msg);
		notify();
		scheduleRemove(msg, MESSAGE_TTL);
	}
)

export const vote = form(
	v.object({
		sender: v.pipe(v.string(), v.minLength(1)),
		optionIndex: v.pipe(v.string(), v.minLength(1)),
	}),
	async ({ sender, optionIndex }) => {
		const idx = parseInt(optionIndex);
		if (isNaN(idx)) return;
		castVote(sender, idx);
		notify();
	}
)
