import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFrequencyVarianceStore } from "./legacy-frequency-variance-store.js";
import { newLegacyFrequencyVariance } from "./legacy-frequency-variance.js";

test("MemoryLegacyFrequencyVarianceStore finds what it saved", () => {
  const store = newMemoryLegacyFrequencyVarianceStore();
  const item = newLegacyFrequencyVariance("code-303", "name-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
