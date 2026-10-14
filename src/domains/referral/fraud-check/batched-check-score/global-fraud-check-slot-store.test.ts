import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFraudCheckSlotStore } from "./global-fraud-check-slot-store.js";
import { newGlobalFraudCheckSlot } from "./global-fraud-check-slot.js";

test("MemoryGlobalFraudCheckSlotStore finds what it saved", () => {
  const store = newMemoryGlobalFraudCheckSlotStore();
  const item = newGlobalFraudCheckSlot("code-207", "title-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
