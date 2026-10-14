import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultBadgeSlotStore } from "./default-badge-slot-store.js";
import { newDefaultBadgeSlot } from "./default-badge-slot.js";

test("MemoryDefaultBadgeSlotStore finds what it saved", () => {
  const store = newMemoryDefaultBadgeSlotStore();
  const item = newDefaultBadgeSlot("code-894", "name-77");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
