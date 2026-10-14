import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedJourneyAgreementView,
  toWeightedJourneyAgreementViews,
} from "./weighted-journey-agreement-view.js";
import { newWeightedJourneyAgreement } from "./weighted-journey-agreement.js";

test("WeightedJourneyAgreementView shows the status in capitals", () => {
  const item = newWeightedJourneyAgreement("code-259", "title-146");
  const view = toWeightedJourneyAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedJourneyAgreementViews([item, item]).length, 2, "views");
});
