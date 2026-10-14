import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedFraudCheckExceptionView,
  toWeightedFraudCheckExceptionViews,
} from "./weighted-fraud-check-exception-view.js";
import { newWeightedFraudCheckException } from "./weighted-fraud-check-exception.js";

test("WeightedFraudCheckExceptionView shows the status in capitals", () => {
  const item = newWeightedFraudCheckException("code-896", "title-817");
  const view = toWeightedFraudCheckExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFraudCheckExceptionViews([item, item]).length, 2, "views");
});
