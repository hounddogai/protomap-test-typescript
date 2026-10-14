import assert from "node:assert/strict";
import { test } from "node:test";
import { toPreferenceAllocationView, toPreferenceAllocationViews } from "./preference-allocation-view.js";
import { newPreferenceAllocation } from "./preference-allocation.js";

test("PreferenceAllocationView shows the status in capitals", () => {
  const item = newPreferenceAllocation("code-768", "name-216");
  const view = toPreferenceAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPreferenceAllocationViews([item, item]).length, 2, "views");
});
