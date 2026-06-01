import * as v from 'valibot'
import { query, form } from '$app/server';

interface Messages {
    id: number
    sender: string
    text: string
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

export const sendMessages = form(
    v.object({
        text: v.pipe(v.string(), v.minLength(1), v.maxLength(1000)),
        sender: v.pipe(v.string(), v.minLength(1), v.maxLength(1000))
    }),
    async ({ sender, text }) => {
        messages.push({ id: id++, sender, text });
        for (const listener of listeners) listener();
        listeners.clear()
    }
)
