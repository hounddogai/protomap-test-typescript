import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySenderAgreementView, toPrimarySenderAgreementViews } from "./primary-sender-agreement-view.js";
import { newPrimarySenderAgreement } from "./primary-sender-agreement.js";

test("PrimarySenderAgreementView shows the status in capitals", () => {
  const item = newPrimarySenderAgreement("code-690", "name-189");
  const view = toPrimarySenderAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySenderAgreementViews([item, item]).length, 2, "views");
});
