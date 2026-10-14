import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledConversionRollupStore } from "./scheduled-conversion-rollup-store.js";
import { newScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

test("MemoryScheduledConversionRollupStore finds what it saved", () => {
  const store = newMemoryScheduledConversionRollupStore();
  const item = newScheduledConversionRollup("code-520", "name-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
