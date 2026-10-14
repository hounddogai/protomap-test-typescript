import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyRecordStore } from "./frequency-record-store.js";
import { newFrequencyRecord } from "./frequency-record.js";

test("MemoryFrequencyRecordStore finds what it saved", () => {
  const store = newMemoryFrequencyRecordStore();
  const item = newFrequencyRecord("code-462", "label-994");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
