import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalLevelOverrideView, toSeasonalLevelOverrideViews } from "./seasonal-level-override-view.js";
import { newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("SeasonalLevelOverrideView shows the status in capitals", () => {
  const item = newSeasonalLevelOverride("code-187", "title-622");
  const view = toSeasonalLevelOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalLevelOverrideViews([item, item]).length, 2, "views");
});
