import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredReplyNoticeStore } from "./tiered-reply-notice-store.js";
import { newTieredReplyNotice } from "./tiered-reply-notice.js";

test("MemoryTieredReplyNoticeStore finds what it saved", () => {
  const store = newMemoryTieredReplyNoticeStore();
  const item = newTieredReplyNotice("code-964", "label-342");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
