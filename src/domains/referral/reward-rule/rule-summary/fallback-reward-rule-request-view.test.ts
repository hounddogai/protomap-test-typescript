import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toFallbackRewardRuleRequestView,
  toFallbackRewardRuleRequestViews,
} from "./fallback-reward-rule-request-view.js";
import { newFallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

test("FallbackRewardRuleRequestView shows the status in capitals", () => {
  const item = newFallbackRewardRuleRequest("code-40", "label-887");
  const view = toFallbackRewardRuleRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackRewardRuleRequestViews([item, item]).length, 2, "views");
});
