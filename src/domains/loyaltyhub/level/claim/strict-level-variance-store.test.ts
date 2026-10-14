import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictLevelVarianceStore } from "./strict-level-variance-store.js";
import { newStrictLevelVariance } from "./strict-level-variance.js";

test("MemoryStrictLevelVarianceStore finds what it saved", () => {
  const store = newMemoryStrictLevelVarianceStore();
  const item = newStrictLevelVariance("code-40", "label-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
