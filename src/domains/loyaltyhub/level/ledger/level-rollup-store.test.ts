import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelRollupStore } from "./level-rollup-store.js";
import { newLevelRollup } from "./level-rollup.js";

test("MemoryLevelRollupStore finds what it saved", () => {
  const store = newMemoryLevelRollupStore();
  const item = newLevelRollup("code-623", "label-639");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
