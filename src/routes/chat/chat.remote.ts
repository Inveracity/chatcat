import * as v from 'valibot'
import { query, form } from '$app/server';
import { MESSAGE_TTL } from '$lib';

interface Messages {
    id: number
    sender: string
    text: string
    createdAt: number
}

const messages: Messages[] = [];
const listeners = new Set<any>();

let id = 1;

export const getMessages = query.live(async function* () {
    while (true) {
        yield messages;
        const { promise, resolve } = Promise.withResolvers();
        listeners.add(resolve);
        await promise;
    }
});

function notify() {
    for (const listener of listeners) listener();
    listeners.clear();
}

function scheduleRemove(msg: Messages, ms: number) {
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

        const msg = { id: id++, sender, text, createdAt: Date.now() };
        messages.push(msg);
        notify();
        scheduleRemove(msg, MESSAGE_TTL);
    }
)
