import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionSlotStore } from "./retention-slot-store.js";
import { newRetentionSlot } from "./retention-slot.js";

test("MemoryRetentionSlotStore finds what it saved", () => {
  const store = newMemoryRetentionSlotStore();
  const item = newRetentionSlot("code-445", "title-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
