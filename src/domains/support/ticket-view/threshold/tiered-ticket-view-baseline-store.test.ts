import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTicketViewBaselineStore } from "./tiered-ticket-view-baseline-store.js";
import { newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("MemoryTieredTicketViewBaselineStore finds what it saved", () => {
  const store = newMemoryTieredTicketViewBaselineStore();
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
