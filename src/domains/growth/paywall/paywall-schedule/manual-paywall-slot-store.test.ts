import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPaywallSlotStore } from "./manual-paywall-slot-store.js";
import { newManualPaywallSlot } from "./manual-paywall-slot.js";

test("MemoryManualPaywallSlotStore finds what it saved", () => {
  const store = newMemoryManualPaywallSlotStore();
  const item = newManualPaywallSlot("code-496", "title-377");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
