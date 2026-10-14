import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingVarianceStore } from "./pacing-variance-store.js";
import { newPacingVariance } from "./pacing-variance.js";

test("MemoryPacingVarianceStore finds what it saved", () => {
  const store = newMemoryPacingVarianceStore();
  const item = newPacingVariance("code-315", "name-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
