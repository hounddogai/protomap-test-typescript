import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPacingVarianceStore } from "./default-pacing-variance-store.js";
import { newDefaultPacingVariance } from "./default-pacing-variance.js";

test("MemoryDefaultPacingVarianceStore finds what it saved", () => {
  const store = newMemoryDefaultPacingVarianceStore();
  const item = newDefaultPacingVariance("code-919", "name-198");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
