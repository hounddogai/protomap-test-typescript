import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionVarianceStore } from "./global-suppression-variance-store.js";
import { newGlobalSuppressionVariance } from "./global-suppression-variance.js";

test("MemoryGlobalSuppressionVarianceStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionVarianceStore();
  const item = newGlobalSuppressionVariance("code-997", "label-826");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
