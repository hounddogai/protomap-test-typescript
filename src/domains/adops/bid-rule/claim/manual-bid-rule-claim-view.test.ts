import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBidRuleClaimView, toManualBidRuleClaimViews } from "./manual-bid-rule-claim-view.js";
import { newManualBidRuleClaim } from "./manual-bid-rule-claim.js";

test("ManualBidRuleClaimView shows the status in capitals", () => {
  const item = newManualBidRuleClaim("code-755", "label-906");
  const view = toManualBidRuleClaimView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBidRuleClaimViews([item, item]).length, 2, "views");
});
