import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPaywallWindowView, toRegionalPaywallWindowViews } from "./regional-paywall-window-view.js";
import { newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("RegionalPaywallWindowView shows the status in capitals", () => {
  const item = newRegionalPaywallWindow("code-101", "title-314");
  const view = toRegionalPaywallWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPaywallWindowViews([item, item]).length, 2, "views");
});
