import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBounceVarianceView, toManualBounceVarianceViews } from "./manual-bounce-variance-view.js";
import { newManualBounceVariance } from "./manual-bounce-variance.js";

test("ManualBounceVarianceView shows the status in capitals", () => {
  const item = newManualBounceVariance("code-275", "label-650");
  const view = toManualBounceVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBounceVarianceViews([item, item]).length, 2, "views");
});
