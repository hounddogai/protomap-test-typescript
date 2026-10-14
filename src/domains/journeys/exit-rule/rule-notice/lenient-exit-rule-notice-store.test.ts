import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientExitRuleNoticeStore } from "./lenient-exit-rule-notice-store.js";
import { newLenientExitRuleNotice } from "./lenient-exit-rule-notice.js";

test("MemoryLenientExitRuleNoticeStore finds what it saved", () => {
  const store = newMemoryLenientExitRuleNoticeStore();
  const item = newLenientExitRuleNotice("code-144", "title-19");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
