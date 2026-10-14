import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyRewardSlotStore } from "./legacy-reward-slot-store.js";
import { newLegacyRewardSlot } from "./legacy-reward-slot.js";

test("MemoryLegacyRewardSlotStore finds what it saved", () => {
  const store = newMemoryLegacyRewardSlotStore();
  const item = newLegacyRewardSlot("code-588", "name-828");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
