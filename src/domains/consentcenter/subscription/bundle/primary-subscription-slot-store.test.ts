import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySubscriptionSlotStore } from "./primary-subscription-slot-store.js";
import { newPrimarySubscriptionSlot } from "./primary-subscription-slot.js";

test("MemoryPrimarySubscriptionSlotStore finds what it saved", () => {
  const store = newMemoryPrimarySubscriptionSlotStore();
  const item = newPrimarySubscriptionSlot("code-922", "title-157");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
