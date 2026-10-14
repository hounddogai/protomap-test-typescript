import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedOptOutAgreementView, toWeightedOptOutAgreementViews } from "./weighted-opt-out-agreement-view.js";
import { newWeightedOptOutAgreement } from "./weighted-opt-out-agreement.js";

test("WeightedOptOutAgreementView shows the status in capitals", () => {
  const item = newWeightedOptOutAgreement("code-611", "title-343");
  const view = toWeightedOptOutAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedOptOutAgreementViews([item, item]).length, 2, "views");
});
