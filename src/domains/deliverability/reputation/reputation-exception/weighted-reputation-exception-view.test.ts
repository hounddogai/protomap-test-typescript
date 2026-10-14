import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedReputationExceptionView,
  toWeightedReputationExceptionViews,
} from "./weighted-reputation-exception-view.js";
import { newWeightedReputationException } from "./weighted-reputation-exception.js";

test("WeightedReputationExceptionView shows the status in capitals", () => {
  const item = newWeightedReputationException("code-365", "label-776");
  const view = toWeightedReputationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedReputationExceptionViews([item, item]).length, 2, "views");
});
