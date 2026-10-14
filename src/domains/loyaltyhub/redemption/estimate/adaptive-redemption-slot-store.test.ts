import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRedemptionSlotStore } from "./adaptive-redemption-slot-store.js";
import { newAdaptiveRedemptionSlot } from "./adaptive-redemption-slot.js";

test("MemoryAdaptiveRedemptionSlotStore finds what it saved", () => {
  const store = newMemoryAdaptiveRedemptionSlotStore();
  const item = newAdaptiveRedemptionSlot("code-627", "title-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
