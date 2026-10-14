import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionSlotStore } from "./mention-slot-store.js";
import { newMentionSlot } from "./mention-slot.js";

test("MemoryMentionSlotStore finds what it saved", () => {
  const store = newMemoryMentionSlotStore();
  const item = newMentionSlot("code-335", "label-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
