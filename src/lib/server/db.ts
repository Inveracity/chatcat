import { Database } from 'bun:sqlite'

const db = new Database('data/chatcat.db')
db.run('PRAGMA journal_mode=WAL')
db.run('CREATE TABLE IF NOT EXISTS message_count (id INTEGER PRIMARY KEY, count INTEGER NOT NULL)')
db.run('INSERT OR IGNORE INTO message_count (id, count) VALUES (1, 0)')

export function getTotalCount(): number {
	const row = db.query('SELECT count FROM message_count WHERE id = 1').get() as {
		count: number
	}
	return row.count
}

export function incrementCount(): number {
	db.run('UPDATE message_count SET count = count + 1 WHERE id = 1')
	return getTotalCount()
}
