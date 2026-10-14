import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionRollupStore } from "./conversion-rollup-store.js";
import { newConversionRollup } from "./conversion-rollup.js";

test("MemoryConversionRollupStore finds what it saved", () => {
  const store = newMemoryConversionRollupStore();
  const item = newConversionRollup("code-242", "label-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
