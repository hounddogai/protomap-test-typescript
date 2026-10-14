import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBidRuleThresholdStore } from "./legacy-bid-rule-threshold-store.js";
import { newLegacyBidRuleThreshold } from "./legacy-bid-rule-threshold.js";

test("MemoryLegacyBidRuleThresholdStore finds what it saved", () => {
  const store = newMemoryLegacyBidRuleThresholdStore();
  const item = newLegacyBidRuleThreshold("code-233", "label-384");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
