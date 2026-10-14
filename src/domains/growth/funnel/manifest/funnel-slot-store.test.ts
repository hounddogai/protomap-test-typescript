import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelSlotStore } from "./funnel-slot-store.js";
import { newFunnelSlot } from "./funnel-slot.js";

test("MemoryFunnelSlotStore finds what it saved", () => {
  const store = newMemoryFunnelSlotStore();
  const item = newFunnelSlot("code-43", "name-426");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
