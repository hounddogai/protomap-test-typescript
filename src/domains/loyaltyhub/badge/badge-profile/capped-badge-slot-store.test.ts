import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBadgeSlotStore } from "./capped-badge-slot-store.js";
import { newCappedBadgeSlot } from "./capped-badge-slot.js";

test("MemoryCappedBadgeSlotStore finds what it saved", () => {
  const store = newMemoryCappedBadgeSlotStore();
  const item = newCappedBadgeSlot("code-567", "title-305");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
