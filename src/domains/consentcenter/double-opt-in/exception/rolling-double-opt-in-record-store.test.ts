import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingDoubleOptInRecordStore } from "./rolling-double-opt-in-record-store.js";
import { newRollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

test("MemoryRollingDoubleOptInRecordStore finds what it saved", () => {
  const store = newMemoryRollingDoubleOptInRecordStore();
  const item = newRollingDoubleOptInRecord("code-23", "name-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
