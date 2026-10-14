import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakAgreementView, toStreakAgreementViews } from "./streak-agreement-view.js";
import { newStreakAgreement } from "./streak-agreement.js";

test("StreakAgreementView shows the status in capitals", () => {
  const item = newStreakAgreement("code-521", "name-459");
  const view = toStreakAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakAgreementViews([item, item]).length, 2, "views");
});
