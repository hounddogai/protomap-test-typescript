import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceAgreementView, toBounceAgreementViews } from "./bounce-agreement-view.js";
import { newBounceAgreement } from "./bounce-agreement.js";

test("BounceAgreementView shows the status in capitals", () => {
  const item = newBounceAgreement("code-509", "title-430");
  const view = toBounceAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceAgreementViews([item, item]).length, 2, "views");
});
