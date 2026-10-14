import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPlacementSlotStore } from "./manual-placement-slot-store.js";
import { newManualPlacementSlot } from "./manual-placement-slot.js";

test("MemoryManualPlacementSlotStore finds what it saved", () => {
  const store = newMemoryManualPlacementSlotStore();
  const item = newManualPlacementSlot("code-407", "name-716");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
