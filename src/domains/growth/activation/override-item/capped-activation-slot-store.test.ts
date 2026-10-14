import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedActivationSlotStore } from "./capped-activation-slot-store.js";
import { newCappedActivationSlot } from "./capped-activation-slot.js";

test("MemoryCappedActivationSlotStore finds what it saved", () => {
  const store = newMemoryCappedActivationSlotStore();
  const item = newCappedActivationSlot("code-624", "name-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
