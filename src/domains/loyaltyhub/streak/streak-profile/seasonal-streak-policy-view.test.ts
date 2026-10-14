import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalStreakPolicyView, toSeasonalStreakPolicyViews } from "./seasonal-streak-policy-view.js";
import { newSeasonalStreakPolicy } from "./seasonal-streak-policy.js";

test("SeasonalStreakPolicyView shows the status in capitals", () => {
  const item = newSeasonalStreakPolicy("code-602", "name-383");
  const view = toSeasonalStreakPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalStreakPolicyViews([item, item]).length, 2, "views");
});
