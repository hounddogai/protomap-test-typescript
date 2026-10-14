import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPacingVarianceStore } from "./primary-pacing-variance-store.js";
import { newPrimaryPacingVariance } from "./primary-pacing-variance.js";

test("MemoryPrimaryPacingVarianceStore finds what it saved", () => {
  const store = newMemoryPrimaryPacingVarianceStore();
  const item = newPrimaryPacingVariance("code-401", "name-160");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
