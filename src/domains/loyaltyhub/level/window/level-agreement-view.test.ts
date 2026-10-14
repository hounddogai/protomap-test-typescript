import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelAgreementView, toLevelAgreementViews } from "./level-agreement-view.js";
import { newLevelAgreement } from "./level-agreement.js";

test("LevelAgreementView shows the status in capitals", () => {
  const item = newLevelAgreement("code-825", "label-767");
  const view = toLevelAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelAgreementViews([item, item]).length, 2, "views");
});
