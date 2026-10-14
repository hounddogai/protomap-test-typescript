import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientActivationThresholdStore } from "./lenient-activation-threshold-store.js";
import { newLenientActivationThreshold } from "./lenient-activation-threshold.js";

test("MemoryLenientActivationThresholdStore finds what it saved", () => {
  const store = newMemoryLenientActivationThresholdStore();
  const item = newLenientActivationThreshold("code-844", "name-150");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
