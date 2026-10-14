import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchRecordStore } from "./branch-record-store.js";
import { newBranchRecord } from "./branch-record.js";

test("MemoryBranchRecordStore finds what it saved", () => {
  const store = newMemoryBranchRecordStore();
  const item = newBranchRecord("code-579", "label-56");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
