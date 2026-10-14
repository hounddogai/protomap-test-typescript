import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeNoticeStore } from "./creative-notice-store.js";
import { newCreativeNotice } from "./creative-notice.js";

test("MemoryCreativeNoticeStore finds what it saved", () => {
  const store = newMemoryCreativeNoticeStore();
  const item = newCreativeNotice("code-931", "title-53");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
