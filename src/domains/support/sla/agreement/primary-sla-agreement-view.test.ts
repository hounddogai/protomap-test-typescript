import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimarySlaAgreementView, toPrimarySlaAgreementViews } from "./primary-sla-agreement-view.js";
import { newPrimarySlaAgreement } from "./primary-sla-agreement.js";

test("PrimarySlaAgreementView shows the status in capitals", () => {
  const item = newPrimarySlaAgreement("code-457", "title-144");
  const view = toPrimarySlaAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimarySlaAgreementViews([item, item]).length, 2, "views");
});
