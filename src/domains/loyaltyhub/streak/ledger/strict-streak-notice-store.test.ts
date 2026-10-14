import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictStreakNoticeStore } from "./strict-streak-notice-store.js";
import { newStrictStreakNotice } from "./strict-streak-notice.js";

test("MemoryStrictStreakNoticeStore finds what it saved", () => {
  const store = newMemoryStrictStreakNoticeStore();
  const item = newStrictStreakNotice("code-708", "label-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
