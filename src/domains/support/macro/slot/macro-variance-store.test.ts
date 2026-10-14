import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroVarianceStore } from "./macro-variance-store.js";
import { newMacroVariance } from "./macro-variance.js";

test("MemoryMacroVarianceStore finds what it saved", () => {
  const store = newMemoryMacroVarianceStore();
  const item = newMacroVariance("code-744", "label-758");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
