import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingSenderAgreementView, toPendingSenderAgreementViews } from "./pending-sender-agreement-view.js";
import { newPendingSenderAgreement } from "./pending-sender-agreement.js";

test("PendingSenderAgreementView shows the status in capitals", () => {
  const item = newPendingSenderAgreement("code-650", "label-915");
  const view = toPendingSenderAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingSenderAgreementViews([item, item]).length, 2, "views");
});
