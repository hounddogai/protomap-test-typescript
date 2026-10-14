import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelNoticeStore } from "./level-notice-store.js";
import { newLevelNotice } from "./level-notice.js";

test("MemoryLevelNoticeStore finds what it saved", () => {
  const store = newMemoryLevelNoticeStore();
  const item = newLevelNotice("code-167", "label-448");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
