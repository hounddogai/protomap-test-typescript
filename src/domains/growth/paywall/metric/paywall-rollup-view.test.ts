import assert from "node:assert/strict";
import { test } from "node:test";
import { toPaywallRollupView, toPaywallRollupViews } from "./paywall-rollup-view.js";
import { newPaywallRollup } from "./paywall-rollup.js";

test("PaywallRollupView shows the status in capitals", () => {
  const item = newPaywallRollup("code-352", "label-943");
  const view = toPaywallRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPaywallRollupViews([item, item]).length, 2, "views");
});
