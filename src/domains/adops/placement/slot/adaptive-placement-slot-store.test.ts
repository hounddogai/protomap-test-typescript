import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePlacementSlotStore } from "./adaptive-placement-slot-store.js";
import { newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

test("MemoryAdaptivePlacementSlotStore finds what it saved", () => {
  const store = newMemoryAdaptivePlacementSlotStore();
  const item = newAdaptivePlacementSlot("code-174", "label-251");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
