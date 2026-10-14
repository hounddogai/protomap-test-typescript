import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWarmupRollupStore } from "./seasonal-warmup-rollup-store.js";
import { newSeasonalWarmupRollup } from "./seasonal-warmup-rollup.js";

test("MemorySeasonalWarmupRollupStore finds what it saved", () => {
  const store = newMemorySeasonalWarmupRollupStore();
  const item = newSeasonalWarmupRollup("code-407", "name-115");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
