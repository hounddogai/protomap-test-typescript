import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPlacementSlotStore } from "./regional-placement-slot-store.js";
import { newRegionalPlacementSlot } from "./regional-placement-slot.js";

test("MemoryRegionalPlacementSlotStore finds what it saved", () => {
  const store = newMemoryRegionalPlacementSlotStore();
  const item = newRegionalPlacementSlot("code-714", "title-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
