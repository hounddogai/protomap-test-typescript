import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTicketViewThresholdStore } from "./capped-ticket-view-threshold-store.js";
import { newCappedTicketViewThreshold } from "./capped-ticket-view-threshold.js";

test("MemoryCappedTicketViewThresholdStore finds what it saved", () => {
  const store = newMemoryCappedTicketViewThresholdStore();
  const item = newCappedTicketViewThreshold("code-714", "label-510");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
