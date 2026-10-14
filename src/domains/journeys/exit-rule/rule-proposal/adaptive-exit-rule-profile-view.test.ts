import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveExitRuleProfileView, toAdaptiveExitRuleProfileViews } from "./adaptive-exit-rule-profile-view.js";
import { newAdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

test("AdaptiveExitRuleProfileView shows the status in capitals", () => {
  const item = newAdaptiveExitRuleProfile("code-35", "label-49");
  const view = toAdaptiveExitRuleProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveExitRuleProfileViews([item, item]).length, 2, "views");
});
