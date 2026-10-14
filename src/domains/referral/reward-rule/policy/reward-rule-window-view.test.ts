import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleWindowView, toRewardRuleWindowViews } from "./reward-rule-window-view.js";
import { newRewardRuleWindow } from "./reward-rule-window.js";

test("RewardRuleWindowView shows the status in capitals", () => {
  const item = newRewardRuleWindow("code-720", "name-859");
  const view = toRewardRuleWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleWindowViews([item, item]).length, 2, "views");
});
