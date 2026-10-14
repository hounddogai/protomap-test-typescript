import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitNoticeStore } from "./wait-notice-store.js";
import { newWaitNotice } from "./wait-notice.js";

test("MemoryWaitNoticeStore finds what it saved", () => {
  const store = newMemoryWaitNoticeStore();
  const item = newWaitNotice("code-544", "name-412");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
