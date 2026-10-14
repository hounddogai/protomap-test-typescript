import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFrequencyCycleView, toBatchedFrequencyCycleViews } from "./batched-frequency-cycle-view.js";
import { newBatchedFrequencyCycle } from "./batched-frequency-cycle.js";

test("BatchedFrequencyCycleView shows the status in capitals", () => {
  const item = newBatchedFrequencyCycle("code-460", "label-928");
  const view = toBatchedFrequencyCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFrequencyCycleViews([item, item]).length, 2, "views");
});
