import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointNoticeStore } from "./touchpoint-notice-store.js";
import { newTouchpointNotice } from "./touchpoint-notice.js";

test("MemoryTouchpointNoticeStore finds what it saved", () => {
  const store = newMemoryTouchpointNoticeStore();
  const item = newTouchpointNotice("code-748", "name-675");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
