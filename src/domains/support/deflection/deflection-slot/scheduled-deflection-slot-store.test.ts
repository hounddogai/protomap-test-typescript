import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionSlotStore } from "./scheduled-deflection-slot-store.js";
import { newScheduledDeflectionSlot } from "./scheduled-deflection-slot.js";

test("MemoryScheduledDeflectionSlotStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionSlotStore();
  const item = newScheduledDeflectionSlot("code-878", "name-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
