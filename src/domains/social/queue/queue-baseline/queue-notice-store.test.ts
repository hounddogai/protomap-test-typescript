import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueNoticeStore } from "./queue-notice-store.js";
import { newQueueNotice } from "./queue-notice.js";

test("MemoryQueueNoticeStore finds what it saved", () => {
  const store = newMemoryQueueNoticeStore();
  const item = newQueueNotice("code-49", "title-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
