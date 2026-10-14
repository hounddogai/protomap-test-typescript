import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyAllocationStore } from "./reply-allocation-store.js";
import { newReplyAllocation } from "./reply-allocation.js";

test("MemoryReplyAllocationStore finds what it saved", () => {
  const store = newMemoryReplyAllocationStore();
  const item = newReplyAllocation("code-528", "label-668");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
