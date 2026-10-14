import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReplyRecordStore } from "./weighted-reply-record-store.js";
import { newWeightedReplyRecord } from "./weighted-reply-record.js";

test("MemoryWeightedReplyRecordStore finds what it saved", () => {
  const store = newMemoryWeightedReplyRecordStore();
  const item = newWeightedReplyRecord("code-795", "title-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
