import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLenientSuppressionAgreementView,
  toLenientSuppressionAgreementViews,
} from "./lenient-suppression-agreement-view.js";
import { newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("LenientSuppressionAgreementView shows the status in capitals", () => {
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  const view = toLenientSuppressionAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSuppressionAgreementViews([item, item]).length, 2, "views");
});
