import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPaywallCycleView, toPrimaryPaywallCycleViews } from "./primary-paywall-cycle-view.js";
import { newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

test("PrimaryPaywallCycleView shows the status in capitals", () => {
  const item = newPrimaryPaywallCycle("code-481", "label-699");
  const view = toPrimaryPaywallCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPaywallCycleViews([item, item]).length, 2, "views");
});
