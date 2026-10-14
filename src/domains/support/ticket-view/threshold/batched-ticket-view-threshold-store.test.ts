import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedTicketViewThresholdStore } from "./batched-ticket-view-threshold-store.js";
import { newBatchedTicketViewThreshold } from "./batched-ticket-view-threshold.js";

test("MemoryBatchedTicketViewThresholdStore finds what it saved", () => {
  const store = newMemoryBatchedTicketViewThresholdStore();
  const item = newBatchedTicketViewThreshold("code-526", "name-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
