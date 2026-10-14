import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathEstimateView, toPathEstimateViews } from "./path-estimate-view.js";
import { newPathEstimate } from "./path-estimate.js";

test("PathEstimateView shows the status in capitals", () => {
  const item = newPathEstimate("code-413", "title-727");
  const view = toPathEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathEstimateViews([item, item]).length, 2, "views");
});
