import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedRewardRuleNoticeStore } from "./capped-reward-rule-notice-store.js";
import { newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

test("MemoryCappedRewardRuleNoticeStore finds what it saved", () => {
  const store = newMemoryCappedRewardRuleNoticeStore();
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
