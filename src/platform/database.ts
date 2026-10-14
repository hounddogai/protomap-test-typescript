import knex, { type Knex } from "knex";

export function database(url: string): Knex {
  return knex({ client: "pg", connection: url, pool: { min: 0, max: 20 }, acquireConnectionTimeout: 5_000 });
}

/** Deployment runs this command before accepting traffic; handlers never create tables. */
export async function migrate(db: Knex): Promise<void> {
  if (!await db.schema.hasTable("engagement_records")) {
    await db.schema.createTable("engagement_records", (table) => {
      table.string("tenant_id").notNullable();
      table.string("kind").notNullable();
      table.string("record_id").notNullable();
      table.jsonb("payload").notNullable();
      table.primary(["tenant_id", "kind", "record_id"]);
    });
  }
  if (!await db.schema.hasTable("engagement_actions")) {
    await db.schema.createTable("engagement_actions", (table) => {
      table.bigIncrements("id");
      table.string("tenant_id").notNullable();
      table.string("domain").notNullable();
      table.string("action").notNullable();
      table.jsonb("payload").notNullable();
    });
  }
}
