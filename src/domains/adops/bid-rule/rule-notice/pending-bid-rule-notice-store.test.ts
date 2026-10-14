import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBidRuleNoticeStore } from "./pending-bid-rule-notice-store.js";
import { newPendingBidRuleNotice } from "./pending-bid-rule-notice.js";

test("MemoryPendingBidRuleNoticeStore finds what it saved", () => {
  const store = newMemoryPendingBidRuleNoticeStore();
  const item = newPendingBidRuleNotice("code-111", "title-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
