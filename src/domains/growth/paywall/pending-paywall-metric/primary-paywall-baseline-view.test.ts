import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPaywallBaselineView, toPrimaryPaywallBaselineViews } from "./primary-paywall-baseline-view.js";
import { newPrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

test("PrimaryPaywallBaselineView shows the status in capitals", () => {
  const item = newPrimaryPaywallBaseline("code-713", "title-117");
  const view = toPrimaryPaywallBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPaywallBaselineViews([item, item]).length, 2, "views");
});
