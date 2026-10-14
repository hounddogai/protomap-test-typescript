import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toManualRetentionAgreementView,
  toManualRetentionAgreementViews,
} from "./manual-retention-agreement-view.js";
import { newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("ManualRetentionAgreementView shows the status in capitals", () => {
  const item = newManualRetentionAgreement("code-894", "name-806");
  const view = toManualRetentionAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualRetentionAgreementViews([item, item]).length, 2, "views");
});
