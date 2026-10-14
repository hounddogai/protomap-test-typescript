import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBidRuleProfileView, toManualBidRuleProfileViews } from "./manual-bid-rule-profile-view.js";
import { newManualBidRuleProfile } from "./manual-bid-rule-profile.js";

test("ManualBidRuleProfileView shows the status in capitals", () => {
  const item = newManualBidRuleProfile("code-467", "label-332");
  const view = toManualBidRuleProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBidRuleProfileViews([item, item]).length, 2, "views");
});
