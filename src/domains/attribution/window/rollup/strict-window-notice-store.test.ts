import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWindowNoticeStore } from "./strict-window-notice-store.js";
import { newStrictWindowNotice } from "./strict-window-notice.js";

test("MemoryStrictWindowNoticeStore finds what it saved", () => {
  const store = newMemoryStrictWindowNoticeStore();
  const item = newStrictWindowNotice("code-261", "label-672");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
