import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFrequencyRecordStore } from "./default-frequency-record-store.js";
import { newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("MemoryDefaultFrequencyRecordStore finds what it saved", () => {
  const store = newMemoryDefaultFrequencyRecordStore();
  const item = newDefaultFrequencyRecord("code-320", "label-560");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
