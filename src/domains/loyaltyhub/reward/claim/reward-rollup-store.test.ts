import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRollupStore } from "./reward-rollup-store.js";
import { newRewardRollup } from "./reward-rollup.js";

test("MemoryRewardRollupStore finds what it saved", () => {
  const store = newMemoryRewardRollupStore();
  const item = newRewardRollup("code-906", "name-236");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
