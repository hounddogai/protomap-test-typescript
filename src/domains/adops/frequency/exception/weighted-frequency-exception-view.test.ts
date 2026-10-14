import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedFrequencyExceptionView,
  toWeightedFrequencyExceptionViews,
} from "./weighted-frequency-exception-view.js";
import { newWeightedFrequencyException } from "./weighted-frequency-exception.js";

test("WeightedFrequencyExceptionView shows the status in capitals", () => {
  const item = newWeightedFrequencyException("code-919", "label-712");
  const view = toWeightedFrequencyExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedFrequencyExceptionViews([item, item]).length, 2, "views");
});
