import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteAgreementView, toInviteAgreementViews } from "./invite-agreement-view.js";
import { newInviteAgreement } from "./invite-agreement.js";

test("InviteAgreementView shows the status in capitals", () => {
  const item = newInviteAgreement("code-59", "label-588");
  const view = toInviteAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteAgreementViews([item, item]).length, 2, "views");
});
