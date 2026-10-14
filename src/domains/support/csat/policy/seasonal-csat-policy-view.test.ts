import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCsatPolicyView, toSeasonalCsatPolicyViews } from "./seasonal-csat-policy-view.js";
import { newSeasonalCsatPolicy } from "./seasonal-csat-policy.js";

test("SeasonalCsatPolicyView shows the status in capitals", () => {
  const item = newSeasonalCsatPolicy("code-40", "name-347");
  const view = toSeasonalCsatPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCsatPolicyViews([item, item]).length, 2, "views");
});
