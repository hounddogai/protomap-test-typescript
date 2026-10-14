import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCohortRollupView, toSeasonalCohortRollupViews } from "./seasonal-cohort-rollup-view.js";
import { newSeasonalCohortRollup } from "./seasonal-cohort-rollup.js";

test("SeasonalCohortRollupView shows the status in capitals", () => {
  const item = newSeasonalCohortRollup("code-45", "name-497");
  const view = toSeasonalCohortRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCohortRollupViews([item, item]).length, 2, "views");
});
