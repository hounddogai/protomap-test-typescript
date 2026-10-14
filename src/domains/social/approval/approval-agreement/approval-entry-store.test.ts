import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalEntryStore } from "./approval-entry-store.js";
import { newApprovalEntry } from "./approval-entry.js";

test("MemoryApprovalEntryStore finds what it saved", () => {
  const store = newMemoryApprovalEntryStore();
  const item = newApprovalEntry("code-112", "label-187");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
