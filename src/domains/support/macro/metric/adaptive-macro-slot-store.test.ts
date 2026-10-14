import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveMacroSlotStore } from "./adaptive-macro-slot-store.js";
import { newAdaptiveMacroSlot } from "./adaptive-macro-slot.js";

test("MemoryAdaptiveMacroSlotStore finds what it saved", () => {
  const store = newMemoryAdaptiveMacroSlotStore();
  const item = newAdaptiveMacroSlot("code-277", "name-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
