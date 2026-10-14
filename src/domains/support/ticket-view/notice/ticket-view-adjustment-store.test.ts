import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewAdjustmentStore } from "./ticket-view-adjustment-store.js";
import { newTicketViewAdjustment } from "./ticket-view-adjustment.js";

test("MemoryTicketViewAdjustmentStore finds what it saved", () => {
  const store = newMemoryTicketViewAdjustmentStore();
  const item = newTicketViewAdjustment("code-256", "name-826");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
