import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalDomainAgreementView, toSeasonalDomainAgreementViews } from "./seasonal-domain-agreement-view.js";
import { newSeasonalDomainAgreement } from "./seasonal-domain-agreement.js";

test("SeasonalDomainAgreementView shows the status in capitals", () => {
  const item = newSeasonalDomainAgreement("code-141", "title-555");
  const view = toSeasonalDomainAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDomainAgreementViews([item, item]).length, 2, "views");
});
