import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientStreakVarianceView, toLenientStreakVarianceViews } from "./lenient-streak-variance-view.js";
import { newLenientStreakVariance } from "./lenient-streak-variance.js";

test("LenientStreakVarianceView shows the status in capitals", () => {
  const item = newLenientStreakVariance("code-65", "title-456");
  const view = toLenientStreakVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientStreakVarianceViews([item, item]).length, 2, "views");
});
