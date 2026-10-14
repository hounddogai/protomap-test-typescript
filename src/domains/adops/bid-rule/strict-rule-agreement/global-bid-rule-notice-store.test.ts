import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBidRuleNoticeStore } from "./global-bid-rule-notice-store.js";
import { newGlobalBidRuleNotice } from "./global-bid-rule-notice.js";

test("MemoryGlobalBidRuleNoticeStore finds what it saved", () => {
  const store = newMemoryGlobalBidRuleNoticeStore();
  const item = newGlobalBidRuleNotice("code-68", "name-318");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
