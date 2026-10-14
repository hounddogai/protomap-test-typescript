import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTicketViewAdjustmentStore } from "./tiered-ticket-view-adjustment-store.js";
import { newTieredTicketViewAdjustment } from "./tiered-ticket-view-adjustment.js";

test("MemoryTieredTicketViewAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredTicketViewAdjustmentStore();
  const item = newTieredTicketViewAdjustment("code-512", "title-923");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
