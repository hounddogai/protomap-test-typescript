import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutSlotStore } from "./opt-out-slot-store.js";
import { newOptOutSlot } from "./opt-out-slot.js";

test("MemoryOptOutSlotStore finds what it saved", () => {
  const store = newMemoryOptOutSlotStore();
  const item = newOptOutSlot("code-546", "title-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
