import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalExitRuleNoticeStore } from "./regional-exit-rule-notice-store.js";
import { newRegionalExitRuleNotice } from "./regional-exit-rule-notice.js";

test("MemoryRegionalExitRuleNoticeStore finds what it saved", () => {
  const store = newMemoryRegionalExitRuleNoticeStore();
  const item = newRegionalExitRuleNotice("code-380", "title-116");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
