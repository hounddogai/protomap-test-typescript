import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveRewardRuleTargetView,
  toAdaptiveRewardRuleTargetViews,
} from "./adaptive-reward-rule-target-view.js";
import { newAdaptiveRewardRuleTarget } from "./adaptive-reward-rule-target.js";

test("AdaptiveRewardRuleTargetView shows the status in capitals", () => {
  const item = newAdaptiveRewardRuleTarget("code-773", "title-78");
  const view = toAdaptiveRewardRuleTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRewardRuleTargetViews([item, item]).length, 2, "views");
});
