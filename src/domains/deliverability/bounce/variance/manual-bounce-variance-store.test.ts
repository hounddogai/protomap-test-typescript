import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBounceVarianceStore } from "./manual-bounce-variance-store.js";
import { newManualBounceVariance } from "./manual-bounce-variance.js";

test("MemoryManualBounceVarianceStore finds what it saved", () => {
  const store = newMemoryManualBounceVarianceStore();
  const item = newManualBounceVariance("code-275", "label-650");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
