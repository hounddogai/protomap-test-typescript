import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalDeflectionPolicyView,
  toSeasonalDeflectionPolicyViews,
} from "./seasonal-deflection-policy-view.js";
import { newSeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

test("SeasonalDeflectionPolicyView shows the status in capitals", () => {
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  const view = toSeasonalDeflectionPolicyView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDeflectionPolicyViews([item, item]).length, 2, "views");
});
