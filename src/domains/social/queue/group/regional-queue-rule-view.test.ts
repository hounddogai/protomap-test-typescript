import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalQueueRuleView, toRegionalQueueRuleViews } from "./regional-queue-rule-view.js";
import { newRegionalQueueRule } from "./regional-queue-rule.js";

test("RegionalQueueRuleView shows the status in capitals", () => {
  const item = newRegionalQueueRule("code-6", "name-241");
  const view = toRegionalQueueRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalQueueRuleViews([item, item]).length, 2, "views");
});
