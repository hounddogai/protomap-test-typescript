import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictModelRecordStore } from "./strict-model-record-store.js";
import { newStrictModelRecord } from "./strict-model-record.js";

test("MemoryStrictModelRecordStore finds what it saved", () => {
  const store = newMemoryStrictModelRecordStore();
  const item = newStrictModelRecord("code-462", "name-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
