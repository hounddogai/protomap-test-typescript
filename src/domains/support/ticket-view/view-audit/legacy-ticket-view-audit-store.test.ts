import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTicketViewAuditStore } from "./legacy-ticket-view-audit-store.js";
import { newLegacyTicketViewAudit } from "./legacy-ticket-view-audit.js";

test("MemoryLegacyTicketViewAuditStore finds what it saved", () => {
  const store = newMemoryLegacyTicketViewAuditStore();
  const item = newLegacyTicketViewAudit("code-382", "label-937");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
