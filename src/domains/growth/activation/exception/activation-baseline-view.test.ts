import assert from "node:assert/strict";
import { test } from "node:test";
import { toActivationBaselineView, toActivationBaselineViews } from "./activation-baseline-view.js";
import { newActivationBaseline } from "./activation-baseline.js";

test("ActivationBaselineView shows the status in capitals", () => {
  const item = newActivationBaseline("code-548", "label-315");
  const view = toActivationBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toActivationBaselineViews([item, item]).length, 2, "views");
});
