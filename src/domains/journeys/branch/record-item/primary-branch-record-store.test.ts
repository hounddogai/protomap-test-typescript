import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBranchRecordStore } from "./primary-branch-record-store.js";
import { newPrimaryBranchRecord } from "./primary-branch-record.js";

test("MemoryPrimaryBranchRecordStore finds what it saved", () => {
  const store = newMemoryPrimaryBranchRecordStore();
  const item = newPrimaryBranchRecord("code-390", "label-942");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
