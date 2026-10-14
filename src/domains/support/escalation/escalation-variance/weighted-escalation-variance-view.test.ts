import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedEscalationVarianceView,
  toWeightedEscalationVarianceViews,
} from "./weighted-escalation-variance-view.js";
import { newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

test("WeightedEscalationVarianceView shows the status in capitals", () => {
  const item = newWeightedEscalationVariance("code-461", "label-53");
  const view = toWeightedEscalationVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedEscalationVarianceViews([item, item]).length, 2, "views");
});
