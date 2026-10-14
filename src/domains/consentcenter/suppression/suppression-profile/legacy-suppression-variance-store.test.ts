import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySuppressionVarianceStore } from "./legacy-suppression-variance-store.js";
import { newLegacySuppressionVariance } from "./legacy-suppression-variance.js";

test("MemoryLegacySuppressionVarianceStore finds what it saved", () => {
  const store = newMemoryLegacySuppressionVarianceStore();
  const item = newLegacySuppressionVariance("code-921", "title-417");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
