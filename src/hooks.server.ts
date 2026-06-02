import { migrate } from '$lib/server/db'
import { redirect } from '@sveltejs/kit'

migrate()

export const handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/favicon.ico') {
		throw redirect(301, '/favicon.svg')
	}
	return resolve(event)
}
