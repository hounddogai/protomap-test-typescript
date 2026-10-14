import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedMentionRecordStore } from "./capped-mention-record-store.js";
import { newCappedMentionRecord } from "./capped-mention-record.js";

test("MemoryCappedMentionRecordStore finds what it saved", () => {
  const store = newMemoryCappedMentionRecordStore();
  const item = newCappedMentionRecord("code-130", "label-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
