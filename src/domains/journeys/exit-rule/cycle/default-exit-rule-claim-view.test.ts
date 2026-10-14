import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultExitRuleClaimView, toDefaultExitRuleClaimViews } from "./default-exit-rule-claim-view.js";
import { newDefaultExitRuleClaim } from "./default-exit-rule-claim.js";

test("DefaultExitRuleClaimView shows the status in capitals", () => {
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  const view = toDefaultExitRuleClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultExitRuleClaimViews([item, item]).length, 2, "views");
});
