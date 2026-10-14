import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleSegmentView, toRewardRuleSegmentViews } from "./reward-rule-segment-view.js";
import { newRewardRuleSegment } from "./reward-rule-segment.js";

test("RewardRuleSegmentView shows the status in capitals", () => {
  const item = newRewardRuleSegment("code-839", "name-260");
  const view = toRewardRuleSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleSegmentViews([item, item]).length, 2, "views");
});
