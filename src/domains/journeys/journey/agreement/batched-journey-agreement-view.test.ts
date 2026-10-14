import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedJourneyAgreementView, toBatchedJourneyAgreementViews } from "./batched-journey-agreement-view.js";
import { newBatchedJourneyAgreement } from "./batched-journey-agreement.js";

test("BatchedJourneyAgreementView shows the status in capitals", () => {
  const item = newBatchedJourneyAgreement("code-650", "name-305");
  const view = toBatchedJourneyAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedJourneyAgreementViews([item, item]).length, 2, "views");
});
