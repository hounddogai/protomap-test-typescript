import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingBidRuleBatchStore } from "./rolling-bid-rule-batch-store.js";
import { newRollingBidRuleBatch } from "./rolling-bid-rule-batch.js";

test("MemoryRollingBidRuleBatchStore finds what it saved", () => {
  const store = newMemoryRollingBidRuleBatchStore();
  const item = newRollingBidRuleBatch("code-125", "title-174");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
