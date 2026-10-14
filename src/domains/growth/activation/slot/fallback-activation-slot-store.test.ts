import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackActivationSlotStore } from "./fallback-activation-slot-store.js";
import { newFallbackActivationSlot } from "./fallback-activation-slot.js";

test("MemoryFallbackActivationSlotStore finds what it saved", () => {
  const store = newMemoryFallbackActivationSlotStore();
  const item = newFallbackActivationSlot("code-220", "label-511");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
