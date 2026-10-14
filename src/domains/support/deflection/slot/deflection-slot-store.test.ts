import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionSlotStore } from "./deflection-slot-store.js";
import { newDeflectionSlot } from "./deflection-slot.js";

test("MemoryDeflectionSlotStore finds what it saved", () => {
  const store = newMemoryDeflectionSlotStore();
  const item = newDeflectionSlot("code-281", "name-192");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
