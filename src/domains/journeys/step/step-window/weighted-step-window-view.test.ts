import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedStepWindowView, toWeightedStepWindowViews } from "./weighted-step-window-view.js";
import { newWeightedStepWindow } from "./weighted-step-window.js";

test("WeightedStepWindowView shows the status in capitals", () => {
  const item = newWeightedStepWindow("code-238", "label-128");
  const view = toWeightedStepWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedStepWindowViews([item, item]).length, 2, "views");
});
