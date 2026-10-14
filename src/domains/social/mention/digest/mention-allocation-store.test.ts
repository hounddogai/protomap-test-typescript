import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionAllocationStore } from "./mention-allocation-store.js";
import { newMentionAllocation } from "./mention-allocation.js";

test("MemoryMentionAllocationStore finds what it saved", () => {
  const store = newMemoryMentionAllocationStore();
  const item = newMentionAllocation("code-801", "name-531");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
