import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightNoticeStore } from "./insight-notice-store.js";
import { newInsightNotice } from "./insight-notice.js";

test("MemoryInsightNoticeStore finds what it saved", () => {
  const store = newMemoryInsightNoticeStore();
  const item = newInsightNotice("code-319", "title-660");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
