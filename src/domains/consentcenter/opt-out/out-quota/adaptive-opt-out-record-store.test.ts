import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveOptOutRecordStore } from "./adaptive-opt-out-record-store.js";
import { newAdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

test("MemoryAdaptiveOptOutRecordStore finds what it saved", () => {
  const store = newMemoryAdaptiveOptOutRecordStore();
  const item = newAdaptiveOptOutRecord("code-888", "label-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
