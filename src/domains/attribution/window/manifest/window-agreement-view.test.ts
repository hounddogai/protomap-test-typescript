import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowAgreementView, toWindowAgreementViews } from "./window-agreement-view.js";
import { newWindowAgreement } from "./window-agreement.js";

test("WindowAgreementView shows the status in capitals", () => {
  const item = newWindowAgreement("code-563", "name-152");
  const view = toWindowAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowAgreementViews([item, item]).length, 2, "views");
});
