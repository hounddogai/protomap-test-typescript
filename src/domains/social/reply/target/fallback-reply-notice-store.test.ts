import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackReplyNoticeStore } from "./fallback-reply-notice-store.js";
import { newFallbackReplyNotice } from "./fallback-reply-notice.js";

test("MemoryFallbackReplyNoticeStore finds what it saved", () => {
  const store = newMemoryFallbackReplyNoticeStore();
  const item = newFallbackReplyNotice("code-924", "title-935");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
