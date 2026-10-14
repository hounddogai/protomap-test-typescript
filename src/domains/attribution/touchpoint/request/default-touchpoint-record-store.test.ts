import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultTouchpointRecordStore } from "./default-touchpoint-record-store.js";
import { newDefaultTouchpointRecord } from "./default-touchpoint-record.js";

test("MemoryDefaultTouchpointRecordStore finds what it saved", () => {
  const store = newMemoryDefaultTouchpointRecordStore();
  const item = newDefaultTouchpointRecord("code-590", "title-921");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
