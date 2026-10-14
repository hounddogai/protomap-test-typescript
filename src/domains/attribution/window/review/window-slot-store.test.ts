import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowSlotStore } from "./window-slot-store.js";
import { newWindowSlot } from "./window-slot.js";

test("MemoryWindowSlotStore finds what it saved", () => {
  const store = newMemoryWindowSlotStore();
  const item = newWindowSlot("code-711", "name-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
