import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredMacroAgreementView, toTieredMacroAgreementViews } from "./tiered-macro-agreement-view.js";
import { newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("TieredMacroAgreementView shows the status in capitals", () => {
  const item = newTieredMacroAgreement("code-614", "title-344");
  const view = toTieredMacroAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredMacroAgreementViews([item, item]).length, 2, "views");
});
