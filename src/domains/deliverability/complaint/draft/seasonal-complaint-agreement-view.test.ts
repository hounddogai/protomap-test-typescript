import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalComplaintAgreementView,
  toSeasonalComplaintAgreementViews,
} from "./seasonal-complaint-agreement-view.js";
import { newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

test("SeasonalComplaintAgreementView shows the status in capitals", () => {
  const item = newSeasonalComplaintAgreement("code-278", "name-649");
  const view = toSeasonalComplaintAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalComplaintAgreementViews([item, item]).length, 2, "views");
});
