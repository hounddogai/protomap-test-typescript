import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledBidRuleCheckpointStore } from "./scheduled-bid-rule-checkpoint-store.js";
import { newScheduledBidRuleCheckpoint } from "./scheduled-bid-rule-checkpoint.js";

test("MemoryScheduledBidRuleCheckpointStore finds what it saved", () => {
  const store = newMemoryScheduledBidRuleCheckpointStore();
  const item = newScheduledBidRuleCheckpoint("code-105", "name-689");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
