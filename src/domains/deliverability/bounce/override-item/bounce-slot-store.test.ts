import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceSlotStore } from "./bounce-slot-store.js";
import { newBounceSlot } from "./bounce-slot.js";

test("MemoryBounceSlotStore finds what it saved", () => {
  const store = newMemoryBounceSlotStore();
  const item = newBounceSlot("code-224", "title-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
