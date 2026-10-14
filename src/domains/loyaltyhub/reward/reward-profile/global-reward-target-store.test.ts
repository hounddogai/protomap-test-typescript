import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRewardTargetStore } from "./global-reward-target-store.js";
import { newGlobalRewardTarget } from "./global-reward-target.js";

test("MemoryGlobalRewardTargetStore finds what it saved", () => {
  const store = newMemoryGlobalRewardTargetStore();
  const item = newGlobalRewardTarget("code-396", "name-28");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
