import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSlaAgreementView, toRegionalSlaAgreementViews } from "./regional-sla-agreement-view.js";
import { newRegionalSlaAgreement } from "./regional-sla-agreement.js";

test("RegionalSlaAgreementView shows the status in capitals", () => {
  const item = newRegionalSlaAgreement("code-802", "title-545");
  const view = toRegionalSlaAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSlaAgreementViews([item, item]).length, 2, "views");
});
