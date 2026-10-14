import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveRewardRuleEntryView, toAdaptiveRewardRuleEntryViews } from "./adaptive-reward-rule-entry-view.js";
import { newAdaptiveRewardRuleEntry } from "./adaptive-reward-rule-entry.js";

test("AdaptiveRewardRuleEntryView shows the status in capitals", () => {
  const item = newAdaptiveRewardRuleEntry("code-181", "label-849");
  const view = toAdaptiveRewardRuleEntryView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveRewardRuleEntryViews([item, item]).length, 2, "views");
});
