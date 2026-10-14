import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingJourneyAgreementView, toRollingJourneyAgreementViews } from "./rolling-journey-agreement-view.js";
import { newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

test("RollingJourneyAgreementView shows the status in capitals", () => {
  const item = newRollingJourneyAgreement("code-666", "title-296");
  const view = toRollingJourneyAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingJourneyAgreementViews([item, item]).length, 2, "views");
});
