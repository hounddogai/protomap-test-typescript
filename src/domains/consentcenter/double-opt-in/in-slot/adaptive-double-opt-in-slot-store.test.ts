import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDoubleOptInSlotStore } from "./adaptive-double-opt-in-slot-store.js";
import { newAdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

test("MemoryAdaptiveDoubleOptInSlotStore finds what it saved", () => {
  const store = newMemoryAdaptiveDoubleOptInSlotStore();
  const item = newAdaptiveDoubleOptInSlot("code-288", "label-812");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
