import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalReplyRecordStore } from "./regional-reply-record-store.js";
import { newRegionalReplyRecord } from "./regional-reply-record.js";

test("MemoryRegionalReplyRecordStore finds what it saved", () => {
  const store = newMemoryRegionalReplyRecordStore();
  const item = newRegionalReplyRecord("code-586", "title-386");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
