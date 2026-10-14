import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPacingVarianceStore } from "./regional-pacing-variance-store.js";
import { newRegionalPacingVariance } from "./regional-pacing-variance.js";

test("MemoryRegionalPacingVarianceStore finds what it saved", () => {
  const store = newMemoryRegionalPacingVarianceStore();
  const item = newRegionalPacingVariance("code-784", "title-842");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
