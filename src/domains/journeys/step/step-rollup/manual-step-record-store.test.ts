import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualStepRecordStore } from "./manual-step-record-store.js";
import { newManualStepRecord } from "./manual-step-record.js";

test("MemoryManualStepRecordStore finds what it saved", () => {
  const store = newMemoryManualStepRecordStore();
  const item = newManualStepRecord("code-159", "name-94");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
