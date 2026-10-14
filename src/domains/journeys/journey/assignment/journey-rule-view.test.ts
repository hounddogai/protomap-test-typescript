import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyRuleView, toJourneyRuleViews } from "./journey-rule-view.js";
import { newJourneyRule } from "./journey-rule.js";

test("JourneyRuleView shows the status in capitals", () => {
  const item = newJourneyRule("code-962", "label-669");
  const view = toJourneyRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyRuleViews([item, item]).length, 2, "views");
});
