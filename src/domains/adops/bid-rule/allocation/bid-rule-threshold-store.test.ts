import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleThresholdStore } from "./bid-rule-threshold-store.js";
import { newBidRuleThreshold } from "./bid-rule-threshold.js";

test("MemoryBidRuleThresholdStore finds what it saved", () => {
  const store = newMemoryBidRuleThresholdStore();
  const item = newBidRuleThreshold("code-806", "title-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
