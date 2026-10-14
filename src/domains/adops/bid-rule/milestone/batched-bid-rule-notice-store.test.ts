import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedBidRuleNoticeStore } from "./batched-bid-rule-notice-store.js";
import { newBatchedBidRuleNotice } from "./batched-bid-rule-notice.js";

test("MemoryBatchedBidRuleNoticeStore finds what it saved", () => {
  const store = newMemoryBatchedBidRuleNoticeStore();
  const item = newBatchedBidRuleNotice("code-226", "title-20");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
