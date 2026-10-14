import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalSlaVarianceView, toSeasonalSlaVarianceViews } from "./seasonal-sla-variance-view.js";
import { newSeasonalSlaVariance } from "./seasonal-sla-variance.js";

test("SeasonalSlaVarianceView shows the status in capitals", () => {
  const item = newSeasonalSlaVariance("code-942", "name-7");
  const view = toSeasonalSlaVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSlaVarianceViews([item, item]).length, 2, "views");
});
