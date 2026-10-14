/**
 * Tenant-scoped database writes for notifications.
 */

import { type StoredRecord } from "./records.js";
import { type Knex } from "knex";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotificationsRepository {
  constructor(@inject("database") private readonly db: Knex) {}

  async save(record: StoredRecord): Promise<void> {
    await this.db("engagement_records").insert({
      tenant_id: record.tenantId, record_id: record.recordId, kind: record.kind,
      payload: JSON.stringify(record.document),
    }).onConflict(["tenant_id", "kind", "record_id"]).merge(["payload"]);
  }

  async record(tenantId: string, action: string, payload: unknown): Promise<void> {
    await this.db.transaction(async (transaction) => {
      await transaction("engagement_actions").insert({
        tenant_id: tenantId, domain: "notifications", action, payload: JSON.stringify(payload),
      });
    });
  }
}
