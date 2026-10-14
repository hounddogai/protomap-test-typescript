import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPacingVarianceView, toPrimaryPacingVarianceViews } from "./primary-pacing-variance-view.js";
import { newPrimaryPacingVariance } from "./primary-pacing-variance.js";

test("PrimaryPacingVarianceView shows the status in capitals", () => {
  const item = newPrimaryPacingVariance("code-401", "name-160");
  const view = toPrimaryPacingVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPacingVarianceViews([item, item]).length, 2, "views");
});
