import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFunnelBaselineView, toPrimaryFunnelBaselineViews } from "./primary-funnel-baseline-view.js";
import { newPrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

test("PrimaryFunnelBaselineView shows the status in capitals", () => {
  const item = newPrimaryFunnelBaseline("code-422", "name-310");
  const view = toPrimaryFunnelBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFunnelBaselineViews([item, item]).length, 2, "views");
});
