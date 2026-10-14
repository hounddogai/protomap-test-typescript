import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyPacingAgreementView, toLegacyPacingAgreementViews } from "./legacy-pacing-agreement-view.js";
import { newLegacyPacingAgreement } from "./legacy-pacing-agreement.js";

test("LegacyPacingAgreementView shows the status in capitals", () => {
  const item = newLegacyPacingAgreement("code-88", "title-317");
  const view = toLegacyPacingAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyPacingAgreementViews([item, item]).length, 2, "views");
});
