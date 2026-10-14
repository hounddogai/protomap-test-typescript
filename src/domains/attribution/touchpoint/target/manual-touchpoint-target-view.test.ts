import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualTouchpointTargetView, toManualTouchpointTargetViews } from "./manual-touchpoint-target-view.js";
import { newManualTouchpointTarget } from "./manual-touchpoint-target.js";

test("ManualTouchpointTargetView shows the status in capitals", () => {
  const item = newManualTouchpointTarget("code-419", "label-802");
  const view = toManualTouchpointTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualTouchpointTargetViews([item, item]).length, 2, "views");
});
