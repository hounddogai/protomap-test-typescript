import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFrequencyRecordStore } from "./lenient-frequency-record-store.js";
import { newLenientFrequencyRecord } from "./lenient-frequency-record.js";

test("MemoryLenientFrequencyRecordStore finds what it saved", () => {
  const store = newMemoryLenientFrequencyRecordStore();
  const item = newLenientFrequencyRecord("code-305", "label-930");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
