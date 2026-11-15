const path = require("path");
const fs = require("fs");
const os = require("os");

function getDatabase() {
    const targetPath = process.env.SQLITE_DB_PATH 
        ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
        : path.join(__dirname, "../database.sqlite");

    const { DatabaseSync } = require("node:sqlite");

    try {
        const instance = new DatabaseSync(targetPath);
        instance.exec("PRAGMA foreign_keys = ON;");
        // Test writability
        instance.exec("CREATE TABLE IF NOT EXISTS _test_write_perm (id INTEGER); DROP TABLE IF EXISTS _test_write_perm;");
        console.log(`[SQLite] Connected to database at: ${targetPath}`);
        return instance;
    } catch (err) {
        if (err.message && (err.message.includes("readonly") || err.message.includes("unable to open database file") || err.code === "ERR_SQLITE_ERROR")) {
            const fallbackPath = path.join(os.tmpdir(), "rtc_streamer.sqlite");
            console.warn(`[SQLite] Cannot write to ${targetPath} (${err.message}). Using writable path: ${fallbackPath}`);
            const fallbackInstance = new DatabaseSync(fallbackPath);
            fallbackInstance.exec("PRAGMA foreign_keys = ON;");
            return fallbackInstance;
        }
        throw err;
    }
}

let db = getDatabase();

// Initialize SQLite Schema if tables do not exist
function initSchema() {
    const schemaSql = `
    CREATE TABLE IF NOT EXISTS tbl_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tbl_blocked_friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderid INTEGER NOT NULL,
        receiverid INTEGER NOT NULL,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS tbl_chatrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tbl_chatrooms_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tbl_friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tbl_friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderid INTEGER NOT NULL,
        receiverid INTEGER NOT NULL,
        status TEXT
    );

    CREATE TABLE IF NOT EXISTS tbl_private_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT,
        message_status TEXT DEFAULT 'sent',
        delete_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON tbl_users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON tbl_users(email);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_recv ON tbl_friend_requests(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_chatrooms_members_room ON tbl_chatrooms_members(room_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_private_messages_room ON tbl_private_messages(room_id, id);
    `;
    db.exec(schemaSql);
}

initSchema();

/**
 * Normalizes SQL queries from PostgreSQL / MySQL syntax to SQLite syntax
 */
function translateSql(sql) {
    return sql
        // Remove postgres casts like ($1)::text or val::text or ::character varying
        .replace(/\(\$(\d+)\)::text/g, "?$1")
        .replace(/::text/g, "")
        .replace(/::character varying/g, "")
        // Convert CONCAT(a, b) to (a || b)
        .replace(/CONCAT\(([^,]+),\s*([^)]+)\)/gi, "($1 || $2)")
        // Convert $1, $2, $3 to ?1, ?2, ?3 (1-based positional SQLite params)
        .replace(/\$(\d+)/g, "?$1");
}

/**
 * Compatible Pool wrapper providing async .query(sql, params) returning { rows: [...] }
 */
const pool = {
    async query(sqlText, params = []) {
        const safeParams = (params || []).map((p) => (p === undefined ? null : p));
        const cleanSql = translateSql(sqlText);
        const trimmed = cleanSql.trim();
        const isSelect = /^(SELECT|PRAGMA)/i.test(trimmed);
        const hasReturning = /RETURNING/i.test(cleanSql);

        const stmt = db.prepare(cleanSql);

        if (isSelect || hasReturning) {
            const rows = stmt.all(...safeParams);
            return {
                rows: rows || [],
                rowCount: rows ? rows.length : 0
            };
        } else {
            const info = stmt.run(...safeParams);
            return {
                rows: [],
                rowCount: info.changes || 0,
                lastInsertRowid: info.lastInsertRowid
            };
        }
    },

    close() {
        if (db && typeof db.close === "function") {
            db.close();
        }
    },

    end() {
        this.close();
    }
};

module.exports = pool;
