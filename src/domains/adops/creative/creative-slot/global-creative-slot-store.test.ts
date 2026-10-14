import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalCreativeSlotStore } from "./global-creative-slot-store.js";
import { newGlobalCreativeSlot } from "./global-creative-slot.js";

test("MemoryGlobalCreativeSlotStore finds what it saved", () => {
  const store = newMemoryGlobalCreativeSlotStore();
  const item = newGlobalCreativeSlot("code-823", "label-335");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
