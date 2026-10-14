import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeNoticeStore } from "./nudge-notice-store.js";
import { newNudgeNotice } from "./nudge-notice.js";

test("MemoryNudgeNoticeStore finds what it saved", () => {
  const store = newMemoryNudgeNoticeStore();
  const item = newNudgeNotice("code-611", "title-993");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
