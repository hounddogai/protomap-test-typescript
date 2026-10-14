import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPacingSlotStore } from "./regional-pacing-slot-store.js";
import { newRegionalPacingSlot } from "./regional-pacing-slot.js";

test("MemoryRegionalPacingSlotStore finds what it saved", () => {
  const store = newMemoryRegionalPacingSlotStore();
  const item = newRegionalPacingSlot("code-653", "label-216");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
