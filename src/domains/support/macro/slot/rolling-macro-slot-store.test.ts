import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMacroSlotStore } from "./rolling-macro-slot-store.js";
import { newRollingMacroSlot } from "./rolling-macro-slot.js";

test("MemoryRollingMacroSlotStore finds what it saved", () => {
  const store = newMemoryRollingMacroSlotStore();
  const item = newRollingMacroSlot("code-728", "label-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
