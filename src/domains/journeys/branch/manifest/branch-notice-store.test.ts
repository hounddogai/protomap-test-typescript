import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchNoticeStore } from "./branch-notice-store.js";
import { newBranchNotice } from "./branch-notice.js";

test("MemoryBranchNoticeStore finds what it saved", () => {
  const store = newMemoryBranchNoticeStore();
  const item = newBranchNotice("code-295", "name-665");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
