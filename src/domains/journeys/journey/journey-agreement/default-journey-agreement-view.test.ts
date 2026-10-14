import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultJourneyAgreementView, toDefaultJourneyAgreementViews } from "./default-journey-agreement-view.js";
import { newDefaultJourneyAgreement } from "./default-journey-agreement.js";

test("DefaultJourneyAgreementView shows the status in capitals", () => {
  const item = newDefaultJourneyAgreement("code-406", "name-938");
  const view = toDefaultJourneyAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultJourneyAgreementViews([item, item]).length, 2, "views");
});
