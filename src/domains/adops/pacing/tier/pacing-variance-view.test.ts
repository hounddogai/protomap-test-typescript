import assert from "node:assert/strict";
import { test } from "node:test";
import { toPacingVarianceView, toPacingVarianceViews } from "./pacing-variance-view.js";
import { newPacingVariance } from "./pacing-variance.js";

test("PacingVarianceView shows the status in capitals", () => {
  const item = newPacingVariance("code-315", "name-296");
  const view = toPacingVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPacingVarianceViews([item, item]).length, 2, "views");
});
