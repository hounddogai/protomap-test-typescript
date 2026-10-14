import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainAgreementView, toDomainAgreementViews } from "./domain-agreement-view.js";
import { newDomainAgreement } from "./domain-agreement.js";

test("DomainAgreementView shows the status in capitals", () => {
  const item = newDomainAgreement("code-246", "name-340");
  const view = toDomainAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainAgreementViews([item, item]).length, 2, "views");
});
