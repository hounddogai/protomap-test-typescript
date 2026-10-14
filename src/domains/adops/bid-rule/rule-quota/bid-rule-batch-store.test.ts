import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleBatchStore } from "./bid-rule-batch-store.js";
import { newBidRuleBatch } from "./bid-rule-batch.js";

test("MemoryBidRuleBatchStore finds what it saved", () => {
  const store = newMemoryBidRuleBatchStore();
  const item = newBidRuleBatch("code-366", "label-723");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
