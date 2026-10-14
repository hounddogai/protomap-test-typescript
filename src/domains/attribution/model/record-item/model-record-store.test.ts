import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelRecordStore } from "./model-record-store.js";
import { newModelRecord } from "./model-record.js";

test("MemoryModelRecordStore finds what it saved", () => {
  const store = newMemoryModelRecordStore();
  const item = newModelRecord("code-910", "name-264");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
