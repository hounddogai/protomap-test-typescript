import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedInsightOverrideView, toWeightedInsightOverrideViews } from "./weighted-insight-override-view.js";
import { newWeightedInsightOverride } from "./weighted-insight-override.js";

test("WeightedInsightOverrideView shows the status in capitals", () => {
  const item = newWeightedInsightOverride("code-95", "label-864");
  const view = toWeightedInsightOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedInsightOverrideViews([item, item]).length, 2, "views");
});
