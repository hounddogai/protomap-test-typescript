import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledBidRuleNoticeStore } from "./scheduled-bid-rule-notice-store.js";
import { newScheduledBidRuleNotice } from "./scheduled-bid-rule-notice.js";

test("MemoryScheduledBidRuleNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledBidRuleNoticeStore();
  const item = newScheduledBidRuleNotice("code-425", "label-457");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
