import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedInviteNoticeStore } from "./batched-invite-notice-store.js";
import { newBatchedInviteNotice } from "./batched-invite-notice.js";

test("MemoryBatchedInviteNoticeStore finds what it saved", () => {
  const store = newMemoryBatchedInviteNoticeStore();
  const item = newBatchedInviteNotice("code-748", "name-649");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
