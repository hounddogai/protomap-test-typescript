import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalSlaOverrideView, toSeasonalSlaOverrideViews } from "./seasonal-sla-override-view.js";
import { newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("SeasonalSlaOverrideView shows the status in capitals", () => {
  const item = newSeasonalSlaOverride("code-432", "label-164");
  const view = toSeasonalSlaOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalSlaOverrideViews([item, item]).length, 2, "views");
});
