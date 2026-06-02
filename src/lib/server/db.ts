import { Database } from 'bun:sqlite'
import type { Stats } from '$lib/types'

const db = new Database('data/chatcat.db')

export function migrate() {
	db.run('PRAGMA journal_mode=WAL')
	db.run('CREATE TABLE IF NOT EXISTS message_count (id INTEGER PRIMARY KEY, count INTEGER NOT NULL, total_characters INTEGER NOT NULL DEFAULT 0)')

	const hasCharColumn = db.query(
		"SELECT name FROM pragma_table_info('message_count') WHERE name = 'total_characters'"
	).get()
	if (!hasCharColumn) {
		db.run('ALTER TABLE message_count ADD COLUMN total_characters INTEGER NOT NULL DEFAULT 0')
	}

	const hasPointsColumn = db.query(
		"SELECT name FROM pragma_table_info('message_count') WHERE name = 'total_points'"
	).get()
	if (!hasPointsColumn) {
		db.run('ALTER TABLE message_count ADD COLUMN total_points INTEGER NOT NULL DEFAULT 0')
	}

	db.run('INSERT OR IGNORE INTO message_count (id, count, total_characters, total_points) VALUES (1, 0, 0, 0)')
}

export function getStats(): Stats {
	const row = db.query('SELECT count AS messages, total_characters AS characters, total_points AS points FROM message_count WHERE id = 1').get() as Stats
	return row
}

export function incrementStats(charCount: number, points: number): Stats {
	db.run('UPDATE message_count SET count = count + 1, total_characters = total_characters + ?1, total_points = total_points + ?2 WHERE id = 1', [charCount, points])
	return getStats()
}
