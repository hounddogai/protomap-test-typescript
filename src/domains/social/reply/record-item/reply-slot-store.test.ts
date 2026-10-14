import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplySlotStore } from "./reply-slot-store.js";
import { newReplySlot } from "./reply-slot.js";

test("MemoryReplySlotStore finds what it saved", () => {
  const store = newMemoryReplySlotStore();
  const item = newReplySlot("code-519", "title-838");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
