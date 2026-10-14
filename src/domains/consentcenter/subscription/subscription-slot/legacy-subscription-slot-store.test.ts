import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySubscriptionSlotStore } from "./legacy-subscription-slot-store.js";
import { newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

test("MemoryLegacySubscriptionSlotStore finds what it saved", () => {
  const store = newMemoryLegacySubscriptionSlotStore();
  const item = newLegacySubscriptionSlot("code-363", "label-197");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
