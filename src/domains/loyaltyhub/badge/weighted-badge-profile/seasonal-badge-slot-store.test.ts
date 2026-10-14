import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalBadgeSlotStore } from "./seasonal-badge-slot-store.js";
import { newSeasonalBadgeSlot } from "./seasonal-badge-slot.js";

test("MemorySeasonalBadgeSlotStore finds what it saved", () => {
  const store = newMemorySeasonalBadgeSlotStore();
  const item = newSeasonalBadgeSlot("code-38", "name-638");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
