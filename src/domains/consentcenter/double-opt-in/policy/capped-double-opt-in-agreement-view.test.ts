import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toCappedDoubleOptInAgreementView,
  toCappedDoubleOptInAgreementViews,
} from "./capped-double-opt-in-agreement-view.js";
import { newCappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

test("CappedDoubleOptInAgreementView shows the status in capitals", () => {
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  const view = toCappedDoubleOptInAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedDoubleOptInAgreementViews([item, item]).length, 2, "views");
});
