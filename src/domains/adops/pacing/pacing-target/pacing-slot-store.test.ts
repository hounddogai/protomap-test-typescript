import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingSlotStore } from "./pacing-slot-store.js";
import { newPacingSlot } from "./pacing-slot.js";

test("MemoryPacingSlotStore finds what it saved", () => {
  const store = newMemoryPacingSlotStore();
  const item = newPacingSlot("code-903", "label-233");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
