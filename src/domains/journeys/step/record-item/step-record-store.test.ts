import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepRecordStore } from "./step-record-store.js";
import { newStepRecord } from "./step-record.js";

test("MemoryStepRecordStore finds what it saved", () => {
  const store = newMemoryStepRecordStore();
  const item = newStepRecord("code-227", "name-940");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
