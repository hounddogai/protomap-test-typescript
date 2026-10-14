import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPlacementSlotStore } from "./strict-placement-slot-store.js";
import { newStrictPlacementSlot } from "./strict-placement-slot.js";

test("MemoryStrictPlacementSlotStore finds what it saved", () => {
  const store = newMemoryStrictPlacementSlotStore();
  const item = newStrictPlacementSlot("code-400", "name-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
