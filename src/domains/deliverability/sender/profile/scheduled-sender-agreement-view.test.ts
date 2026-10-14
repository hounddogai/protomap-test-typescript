import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledSenderAgreementView,
  toScheduledSenderAgreementViews,
} from "./scheduled-sender-agreement-view.js";
import { newScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

test("ScheduledSenderAgreementView shows the status in capitals", () => {
  const item = newScheduledSenderAgreement("code-748", "label-590");
  const view = toScheduledSenderAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledSenderAgreementViews([item, item]).length, 2, "views");
});
