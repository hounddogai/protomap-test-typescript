import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostRecordStore } from "./post-record-store.js";
import { newPostRecord } from "./post-record.js";

test("MemoryPostRecordStore finds what it saved", () => {
  const store = newMemoryPostRecordStore();
  const item = newPostRecord("code-334", "label-155");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
