import { configuration } from "../platform/config.js";
import { database, migrate } from "../platform/database.js";

const db = database(configuration().databaseUrl);
try { await migrate(db); } finally { await db.destroy(); }
