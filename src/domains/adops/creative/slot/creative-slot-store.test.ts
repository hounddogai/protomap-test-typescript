import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeSlotStore } from "./creative-slot-store.js";
import { newCreativeSlot } from "./creative-slot.js";

test("MemoryCreativeSlotStore finds what it saved", () => {
  const store = newMemoryCreativeSlotStore();
  const item = newCreativeSlot("code-105", "label-982");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
