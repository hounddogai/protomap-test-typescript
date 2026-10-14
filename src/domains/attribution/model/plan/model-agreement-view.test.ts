import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelAgreementView, toModelAgreementViews } from "./model-agreement-view.js";
import { newModelAgreement } from "./model-agreement.js";

test("ModelAgreementView shows the status in capitals", () => {
  const item = newModelAgreement("code-583", "title-98");
  const view = toModelAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelAgreementViews([item, item]).length, 2, "views");
});
