import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofThresholdStore } from "./proof-threshold-store.js";
import { newProofThreshold } from "./proof-threshold.js";

test("MemoryProofThresholdStore finds what it saved", () => {
  const store = newMemoryProofThresholdStore();
  const item = newProofThreshold("code-825", "label-840");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
