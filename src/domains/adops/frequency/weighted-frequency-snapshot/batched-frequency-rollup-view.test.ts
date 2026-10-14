import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedFrequencyRollupView, toBatchedFrequencyRollupViews } from "./batched-frequency-rollup-view.js";
import { newBatchedFrequencyRollup } from "./batched-frequency-rollup.js";

test("BatchedFrequencyRollupView shows the status in capitals", () => {
  const item = newBatchedFrequencyRollup("code-884", "label-590");
  const view = toBatchedFrequencyRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedFrequencyRollupViews([item, item]).length, 2, "views");
});
