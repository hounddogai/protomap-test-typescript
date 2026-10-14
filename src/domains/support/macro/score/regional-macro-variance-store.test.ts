import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalMacroVarianceStore } from "./regional-macro-variance-store.js";
import { newRegionalMacroVariance } from "./regional-macro-variance.js";

test("MemoryRegionalMacroVarianceStore finds what it saved", () => {
  const store = newMemoryRegionalMacroVarianceStore();
  const item = newRegionalMacroVariance("code-112", "name-204");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
