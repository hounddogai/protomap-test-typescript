import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalApprovalNoticeStore } from "./regional-approval-notice-store.js";
import { newRegionalApprovalNotice } from "./regional-approval-notice.js";

test("MemoryRegionalApprovalNoticeStore finds what it saved", () => {
  const store = newMemoryRegionalApprovalNoticeStore();
  const item = newRegionalApprovalNotice("code-233", "label-691");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
