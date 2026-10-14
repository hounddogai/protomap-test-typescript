import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedProofAgreementView, toCappedProofAgreementViews } from "./capped-proof-agreement-view.js";
import { newCappedProofAgreement } from "./capped-proof-agreement.js";

test("CappedProofAgreementView shows the status in capitals", () => {
  const item = newCappedProofAgreement("code-529", "name-208");
  const view = toCappedProofAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedProofAgreementViews([item, item]).length, 2, "views");
});
