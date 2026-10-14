import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveFunnelTargetView, toAdaptiveFunnelTargetViews } from "./adaptive-funnel-target-view.js";
import { newAdaptiveFunnelTarget } from "./adaptive-funnel-target.js";

test("AdaptiveFunnelTargetView shows the status in capitals", () => {
  const item = newAdaptiveFunnelTarget("code-900", "name-204");
  const view = toAdaptiveFunnelTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveFunnelTargetViews([item, item]).length, 2, "views");
});
