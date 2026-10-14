import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderNoticeStore } from "./sender-notice-store.js";
import { newSenderNotice } from "./sender-notice.js";

test("MemorySenderNoticeStore finds what it saved", () => {
  const store = newMemorySenderNoticeStore();
  const item = newSenderNotice("code-884", "title-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
