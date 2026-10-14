import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalRewardRuleExceptionView,
  toRegionalRewardRuleExceptionViews,
} from "./regional-reward-rule-exception-view.js";
import { newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

test("RegionalRewardRuleExceptionView shows the status in capitals", () => {
  const item = newRegionalRewardRuleException("code-108", "label-628");
  const view = toRegionalRewardRuleExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRewardRuleExceptionViews([item, item]).length, 2, "views");
});
