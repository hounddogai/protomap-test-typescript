import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientStreakNoticeStore } from "./lenient-streak-notice-store.js";
import { newLenientStreakNotice } from "./lenient-streak-notice.js";

test("MemoryLenientStreakNoticeStore finds what it saved", () => {
  const store = newMemoryLenientStreakNoticeStore();
  const item = newLenientStreakNotice("code-49", "title-604");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
