import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyNoticeStore } from "./reply-notice-store.js";
import { newReplyNotice } from "./reply-notice.js";

test("MemoryReplyNoticeStore finds what it saved", () => {
  const store = newMemoryReplyNoticeStore();
  const item = newReplyNotice("code-269", "label-385");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
