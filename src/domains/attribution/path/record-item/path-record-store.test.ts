import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathRecordStore } from "./path-record-store.js";
import { newPathRecord } from "./path-record.js";

test("MemoryPathRecordStore finds what it saved", () => {
  const store = newMemoryPathRecordStore();
  const item = newPathRecord("code-207", "name-838");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
