import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultRewardRuleWindowView, toDefaultRewardRuleWindowViews } from "./default-reward-rule-window-view.js";
import { newDefaultRewardRuleWindow } from "./default-reward-rule-window.js";

test("DefaultRewardRuleWindowView shows the status in capitals", () => {
  const item = newDefaultRewardRuleWindow("code-305", "title-248");
  const view = toDefaultRewardRuleWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultRewardRuleWindowViews([item, item]).length, 2, "views");
});
