import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingRewardRollupStore } from "./pending-reward-rollup-store.js";
import { newPendingRewardRollup } from "./pending-reward-rollup.js";

test("MemoryPendingRewardRollupStore finds what it saved", () => {
  const store = newMemoryPendingRewardRollupStore();
  const item = newPendingRewardRollup("code-755", "title-597");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
