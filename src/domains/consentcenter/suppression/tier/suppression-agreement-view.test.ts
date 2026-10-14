import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionAgreementView, toSuppressionAgreementViews } from "./suppression-agreement-view.js";
import { newSuppressionAgreement } from "./suppression-agreement.js";

test("SuppressionAgreementView shows the status in capitals", () => {
  const item = newSuppressionAgreement("code-833", "name-378");
  const view = toSuppressionAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionAgreementViews([item, item]).length, 2, "views");
});
