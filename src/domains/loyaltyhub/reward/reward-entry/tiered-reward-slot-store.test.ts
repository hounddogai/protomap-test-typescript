import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardSlotStore } from "./tiered-reward-slot-store.js";
import { newTieredRewardSlot } from "./tiered-reward-slot.js";

test("MemoryTieredRewardSlotStore finds what it saved", () => {
  const store = newMemoryTieredRewardSlotStore();
  const item = newTieredRewardSlot("code-866", "name-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
