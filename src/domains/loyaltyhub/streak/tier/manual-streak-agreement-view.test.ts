import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualStreakAgreementView, toManualStreakAgreementViews } from "./manual-streak-agreement-view.js";
import { newManualStreakAgreement } from "./manual-streak-agreement.js";

test("ManualStreakAgreementView shows the status in capitals", () => {
  const item = newManualStreakAgreement("code-522", "title-139");
  const view = toManualStreakAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualStreakAgreementViews([item, item]).length, 2, "views");
});
