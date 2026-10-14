import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyVarianceStore } from "./frequency-variance-store.js";
import { newFrequencyVariance } from "./frequency-variance.js";

test("MemoryFrequencyVarianceStore finds what it saved", () => {
  const store = newMemoryFrequencyVarianceStore();
  const item = newFrequencyVariance("code-53", "name-945");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
