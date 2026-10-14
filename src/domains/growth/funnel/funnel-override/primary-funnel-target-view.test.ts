import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFunnelTargetView, toPrimaryFunnelTargetViews } from "./primary-funnel-target-view.js";
import { newPrimaryFunnelTarget } from "./primary-funnel-target.js";

test("PrimaryFunnelTargetView shows the status in capitals", () => {
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  const view = toPrimaryFunnelTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFunnelTargetViews([item, item]).length, 2, "views");
});
