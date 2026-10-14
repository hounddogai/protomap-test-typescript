import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMentionRecordStore } from "./rolling-mention-record-store.js";
import { newRollingMentionRecord } from "./rolling-mention-record.js";

test("MemoryRollingMentionRecordStore finds what it saved", () => {
  const store = newMemoryRollingMentionRecordStore();
  const item = newRollingMentionRecord("code-528", "name-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
