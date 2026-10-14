import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalComplaintSlotStore } from "./global-complaint-slot-store.js";
import { newGlobalComplaintSlot } from "./global-complaint-slot.js";

test("MemoryGlobalComplaintSlotStore finds what it saved", () => {
  const store = newMemoryGlobalComplaintSlotStore();
  const item = newGlobalComplaintSlot("code-971", "name-362");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
