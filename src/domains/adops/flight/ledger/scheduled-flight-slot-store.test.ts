import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFlightSlotStore } from "./scheduled-flight-slot-store.js";
import { newScheduledFlightSlot } from "./scheduled-flight-slot.js";

test("MemoryScheduledFlightSlotStore finds what it saved", () => {
  const store = newMemoryScheduledFlightSlotStore();
  const item = newScheduledFlightSlot("code-970", "name-904");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
