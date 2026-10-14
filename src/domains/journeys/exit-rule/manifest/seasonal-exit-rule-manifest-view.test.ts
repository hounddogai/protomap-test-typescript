import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalExitRuleManifestView,
  toSeasonalExitRuleManifestViews,
} from "./seasonal-exit-rule-manifest-view.js";
import { newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("SeasonalExitRuleManifestView shows the status in capitals", () => {
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  const view = toSeasonalExitRuleManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalExitRuleManifestViews([item, item]).length, 2, "views");
});
