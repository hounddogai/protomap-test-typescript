import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientStreakAgreementView, toLenientStreakAgreementViews } from "./lenient-streak-agreement-view.js";
import { newLenientStreakAgreement } from "./lenient-streak-agreement.js";

test("LenientStreakAgreementView shows the status in capitals", () => {
  const item = newLenientStreakAgreement("code-107", "label-968");
  const view = toLenientStreakAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientStreakAgreementViews([item, item]).length, 2, "views");
});
