import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceSlotStore } from "./preference-slot-store.js";
import { newPreferenceSlot } from "./preference-slot.js";

test("MemoryPreferenceSlotStore finds what it saved", () => {
  const store = newMemoryPreferenceSlotStore();
  const item = newPreferenceSlot("code-805", "name-398");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
