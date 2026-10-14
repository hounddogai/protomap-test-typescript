import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalReputationNoticeStore } from "./global-reputation-notice-store.js";
import { newGlobalReputationNotice } from "./global-reputation-notice.js";

test("MemoryGlobalReputationNoticeStore finds what it saved", () => {
  const store = newMemoryGlobalReputationNoticeStore();
  const item = newGlobalReputationNotice("code-750", "title-645");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
