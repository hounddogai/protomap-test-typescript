import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalRewardRollupStore } from "./seasonal-reward-rollup-store.js";
import { newSeasonalRewardRollup } from "./seasonal-reward-rollup.js";

test("MemorySeasonalRewardRollupStore finds what it saved", () => {
  const store = newMemorySeasonalRewardRollupStore();
  const item = newSeasonalRewardRollup("code-775", "label-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
