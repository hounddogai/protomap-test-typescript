import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveMentionAllocationStore } from "./adaptive-mention-allocation-store.js";
import { newAdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

test("MemoryAdaptiveMentionAllocationStore finds what it saved", () => {
  const store = newMemoryAdaptiveMentionAllocationStore();
  const item = newAdaptiveMentionAllocation("code-852", "name-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
