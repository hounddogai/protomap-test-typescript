import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofRecordStore } from "./proof-record-store.js";
import { newProofRecord } from "./proof-record.js";

test("MemoryProofRecordStore finds what it saved", () => {
  const store = newMemoryProofRecordStore();
  const item = newProofRecord("code-531", "label-332");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
