import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleNoticeStore } from "./exit-rule-notice-store.js";
import { newExitRuleNotice } from "./exit-rule-notice.js";

test("MemoryExitRuleNoticeStore finds what it saved", () => {
  const store = newMemoryExitRuleNoticeStore();
  const item = newExitRuleNotice("code-160", "label-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
