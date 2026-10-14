import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveComplaintAgreementView,
  toAdaptiveComplaintAgreementViews,
} from "./adaptive-complaint-agreement-view.js";
import { newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("AdaptiveComplaintAgreementView shows the status in capitals", () => {
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  const view = toAdaptiveComplaintAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveComplaintAgreementViews([item, item]).length, 2, "views");
});
