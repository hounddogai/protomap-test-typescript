import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintSlotStore } from "./complaint-slot-store.js";
import { newComplaintSlot } from "./complaint-slot.js";

test("MemoryComplaintSlotStore finds what it saved", () => {
  const store = newMemoryComplaintSlotStore();
  const item = newComplaintSlot("code-923", "title-968");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
