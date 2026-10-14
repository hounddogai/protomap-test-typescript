import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalExitRuleAgreementView,
  toSeasonalExitRuleAgreementViews,
} from "./seasonal-exit-rule-agreement-view.js";
import { newSeasonalExitRuleAgreement } from "./seasonal-exit-rule-agreement.js";

test("SeasonalExitRuleAgreementView shows the status in capitals", () => {
  const item = newSeasonalExitRuleAgreement("code-618", "title-971");
  const view = toSeasonalExitRuleAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalExitRuleAgreementViews([item, item]).length, 2, "views");
});
