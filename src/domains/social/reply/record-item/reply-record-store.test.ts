import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyRecordStore } from "./reply-record-store.js";
import { newReplyRecord } from "./reply-record.js";

test("MemoryReplyRecordStore finds what it saved", () => {
  const store = newMemoryReplyRecordStore();
  const item = newReplyRecord("code-201", "name-684");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
