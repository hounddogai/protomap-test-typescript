import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledExitRuleNoticeStore } from "./scheduled-exit-rule-notice-store.js";
import { newScheduledExitRuleNotice } from "./scheduled-exit-rule-notice.js";

test("MemoryScheduledExitRuleNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledExitRuleNoticeStore();
  const item = newScheduledExitRuleNotice("code-37", "label-224");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
