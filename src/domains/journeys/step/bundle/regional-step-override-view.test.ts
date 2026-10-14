import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalStepOverrideView, toRegionalStepOverrideViews } from "./regional-step-override-view.js";
import { newRegionalStepOverride } from "./regional-step-override.js";

test("RegionalStepOverrideView shows the status in capitals", () => {
  const item = newRegionalStepOverride("code-123", "label-711");
  const view = toRegionalStepOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalStepOverrideViews([item, item]).length, 2, "views");
});
