import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePayoutSlotStore } from "./adaptive-payout-slot-store.js";
import { newAdaptivePayoutSlot } from "./adaptive-payout-slot.js";

test("MemoryAdaptivePayoutSlotStore finds what it saved", () => {
  const store = newMemoryAdaptivePayoutSlotStore();
  const item = newAdaptivePayoutSlot("code-759", "title-758");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
