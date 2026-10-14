import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFunnelSlotStore } from "./adaptive-funnel-slot-store.js";
import { newAdaptiveFunnelSlot } from "./adaptive-funnel-slot.js";

test("MemoryAdaptiveFunnelSlotStore finds what it saved", () => {
  const store = newMemoryAdaptiveFunnelSlotStore();
  const item = newAdaptiveFunnelSlot("code-898", "title-564");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
