import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakRollupStore } from "./streak-rollup-store.js";
import { newStreakRollup } from "./streak-rollup.js";

test("MemoryStreakRollupStore finds what it saved", () => {
  const store = newMemoryStreakRollupStore();
  const item = newStreakRollup("code-177", "name-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
