import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackNudgeNoticeStore } from "./fallback-nudge-notice-store.js";
import { newFallbackNudgeNotice } from "./fallback-nudge-notice.js";

test("MemoryFallbackNudgeNoticeStore finds what it saved", () => {
  const store = newMemoryFallbackNudgeNoticeStore();
  const item = newFallbackNudgeNotice("code-846", "title-187");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
