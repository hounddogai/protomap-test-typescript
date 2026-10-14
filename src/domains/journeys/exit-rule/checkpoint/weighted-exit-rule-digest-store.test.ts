import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedExitRuleDigestStore } from "./weighted-exit-rule-digest-store.js";
import { newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

test("MemoryWeightedExitRuleDigestStore finds what it saved", () => {
  const store = newMemoryWeightedExitRuleDigestStore();
  const item = newWeightedExitRuleDigest("code-75", "title-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
