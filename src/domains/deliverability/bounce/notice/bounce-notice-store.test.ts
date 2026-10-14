import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceNoticeStore } from "./bounce-notice-store.js";
import { newBounceNotice } from "./bounce-notice.js";

test("MemoryBounceNoticeStore finds what it saved", () => {
  const store = newMemoryBounceNoticeStore();
  const item = newBounceNotice("code-980", "label-904");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
