import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedPlacementPreferenceView,
  toBatchedPlacementPreferenceViews,
} from "./batched-placement-preference-view.js";
import { newBatchedPlacementPreference } from "./batched-placement-preference.js";

test("BatchedPlacementPreferenceView shows the status in capitals", () => {
  const item = newBatchedPlacementPreference("code-376", "name-280");
  const view = toBatchedPlacementPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedPlacementPreferenceViews([item, item]).length, 2, "views");
});
