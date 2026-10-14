import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackQueueRuleView, toFallbackQueueRuleViews } from "./fallback-queue-rule-view.js";
import { newFallbackQueueRule } from "./fallback-queue-rule.js";

test("FallbackQueueRuleView shows the status in capitals", () => {
  const item = newFallbackQueueRule("code-28", "name-223");
  const view = toFallbackQueueRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackQueueRuleViews([item, item]).length, 2, "views");
});
