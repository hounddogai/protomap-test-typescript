import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPaywallWindowView, toRollingPaywallWindowViews } from "./rolling-paywall-window-view.js";
import { newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("RollingPaywallWindowView shows the status in capitals", () => {
  const item = newRollingPaywallWindow("code-539", "label-806");
  const view = toRollingPaywallWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPaywallWindowViews([item, item]).length, 2, "views");
});
