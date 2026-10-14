import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationRuleView, toActivationRuleViews } from "./activation-rule-view.js";
import { newActivationRule } from "./activation-rule.js";

test("ActivationRuleView shows the status in capitals", () => {
  const item = newActivationRule("code-679", "title-800");
  const view = toActivationRuleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationRuleViews([item, item]).length, 2, "views");
});
