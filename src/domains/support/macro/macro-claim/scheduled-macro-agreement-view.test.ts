import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledMacroAgreementView, toScheduledMacroAgreementViews } from "./scheduled-macro-agreement-view.js";
import { newScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

test("ScheduledMacroAgreementView shows the status in capitals", () => {
  const item = newScheduledMacroAgreement("code-536", "label-347");
  const view = toScheduledMacroAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledMacroAgreementViews([item, item]).length, 2, "views");
});
