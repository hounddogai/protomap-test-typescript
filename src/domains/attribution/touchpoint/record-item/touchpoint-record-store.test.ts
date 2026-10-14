import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointRecordStore } from "./touchpoint-record-store.js";
import { newTouchpointRecord } from "./touchpoint-record.js";

test("MemoryTouchpointRecordStore finds what it saved", () => {
  const store = newMemoryTouchpointRecordStore();
  const item = newTouchpointRecord("code-414", "name-820");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
