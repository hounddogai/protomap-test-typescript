import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredExitRuleDigestStore } from "./tiered-exit-rule-digest-store.js";
import { newTieredExitRuleDigest } from "./tiered-exit-rule-digest.js";

test("MemoryTieredExitRuleDigestStore finds what it saved", () => {
  const store = newMemoryTieredExitRuleDigestStore();
  const item = newTieredExitRuleDigest("code-628", "name-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
