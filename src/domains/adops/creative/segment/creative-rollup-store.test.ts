import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeRollupStore } from "./creative-rollup-store.js";
import { newCreativeRollup } from "./creative-rollup.js";

test("MemoryCreativeRollupStore finds what it saved", () => {
  const store = newMemoryCreativeRollupStore();
  const item = newCreativeRollup("code-770", "title-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
