import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedNudgeAllocationStore } from "./capped-nudge-allocation-store.js";
import { newCappedNudgeAllocation } from "./capped-nudge-allocation.js";

test("MemoryCappedNudgeAllocationStore finds what it saved", () => {
  const store = newMemoryCappedNudgeAllocationStore();
  const item = newCappedNudgeAllocation("code-989", "label-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
