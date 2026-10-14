import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationThresholdStore } from "./reputation-threshold-store.js";
import { newReputationThreshold } from "./reputation-threshold.js";

test("MemoryReputationThresholdStore finds what it saved", () => {
  const store = newMemoryReputationThresholdStore();
  const item = newReputationThreshold("code-149", "label-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
