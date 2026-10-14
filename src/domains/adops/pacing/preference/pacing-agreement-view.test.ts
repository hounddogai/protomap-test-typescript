import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingAgreementView, toPacingAgreementViews } from "./pacing-agreement-view.js";
import { newPacingAgreement } from "./pacing-agreement.js";

test("PacingAgreementView shows the status in capitals", () => {
  const item = newPacingAgreement("code-72", "label-164");
  const view = toPacingAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingAgreementViews([item, item]).length, 2, "views");
});
