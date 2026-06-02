import * as v from 'valibot'
import { query, form } from '$app/server';
import { MESSAGE_TTL } from '$lib';
import { getStats, incrementStats } from '$lib/server/db';
import { calculatePoints, getNextMilestone } from '$lib/server/game';
import { setNotifyCallback, startVote, castVote, getVoteState } from '$lib/server/voting';
import type { GameState } from '$lib/types';

interface Message {
	id: number
	sender: string
	text: string
	createdAt: number
}

const messages: Message[] = [];
const listeners = new Set<any>();

let id = 1;

function notify() {
	for (const listener of listeners) listener();
	listeners.clear();
}

setNotifyCallback(notify);

export const getMessages = query.live(async function* () {
	while (true) {
		yield messages;
		const { promise, resolve } = Promise.withResolvers();
		listeners.add(resolve);
		await promise;
	}
});

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
		const points = calculatePoints(text);
		incrementStats(text.length, points);
		const newPoints = oldPoints + points;

		if (Math.floor(oldPoints / 500) < Math.floor(newPoints / 500)) {
			startVote();
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
