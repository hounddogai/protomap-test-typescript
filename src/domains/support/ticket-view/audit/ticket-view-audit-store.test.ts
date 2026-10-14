import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewAuditStore } from "./ticket-view-audit-store.js";
import { newTicketViewAudit } from "./ticket-view-audit.js";

test("MemoryTicketViewAuditStore finds what it saved", () => {
  const store = newMemoryTicketViewAuditStore();
  const item = newTicketViewAudit("code-551", "title-524");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
