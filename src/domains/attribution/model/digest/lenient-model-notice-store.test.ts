import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientModelNoticeStore } from "./lenient-model-notice-store.js";
import { newLenientModelNotice } from "./lenient-model-notice.js";

test("MemoryLenientModelNoticeStore finds what it saved", () => {
  const store = newMemoryLenientModelNoticeStore();
  const item = newLenientModelNotice("code-735", "title-918");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
