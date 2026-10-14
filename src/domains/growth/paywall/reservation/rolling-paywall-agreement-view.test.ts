import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPaywallAgreementView, toRollingPaywallAgreementViews } from "./rolling-paywall-agreement-view.js";
import { newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("RollingPaywallAgreementView shows the status in capitals", () => {
  const item = newRollingPaywallAgreement("code-974", "label-668");
  const view = toRollingPaywallAgreementView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPaywallAgreementViews([item, item]).length, 2, "views");
});
