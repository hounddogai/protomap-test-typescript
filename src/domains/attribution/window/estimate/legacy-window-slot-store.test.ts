import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWindowSlotStore } from "./legacy-window-slot-store.js";
import { newLegacyWindowSlot } from "./legacy-window-slot.js";

test("MemoryLegacyWindowSlotStore finds what it saved", () => {
  const store = newMemoryLegacyWindowSlotStore();
  const item = newLegacyWindowSlot("code-843", "title-291");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
