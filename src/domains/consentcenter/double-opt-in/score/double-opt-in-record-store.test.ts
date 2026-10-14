import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInRecordStore } from "./double-opt-in-record-store.js";
import { newDoubleOptInRecord } from "./double-opt-in-record.js";

test("MemoryDoubleOptInRecordStore finds what it saved", () => {
  const store = newMemoryDoubleOptInRecordStore();
  const item = newDoubleOptInRecord("code-502", "label-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
