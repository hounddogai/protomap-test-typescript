import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathSlotStore } from "./path-slot-store.js";
import { newPathSlot } from "./path-slot.js";

test("MemoryPathSlotStore finds what it saved", () => {
  const store = newMemoryPathSlotStore();
  const item = newPathSlot("code-444", "name-457");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
