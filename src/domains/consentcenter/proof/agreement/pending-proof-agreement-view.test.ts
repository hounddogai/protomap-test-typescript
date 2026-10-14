import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingProofAgreementView, toPendingProofAgreementViews } from "./pending-proof-agreement-view.js";
import { newPendingProofAgreement } from "./pending-proof-agreement.js";

test("PendingProofAgreementView shows the status in capitals", () => {
  const item = newPendingProofAgreement("code-565", "name-400");
  const view = toPendingProofAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingProofAgreementViews([item, item]).length, 2, "views");
});
