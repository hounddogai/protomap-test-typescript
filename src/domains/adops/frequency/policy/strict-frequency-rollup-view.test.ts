import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFrequencyRollupView, toStrictFrequencyRollupViews } from "./strict-frequency-rollup-view.js";
import { newStrictFrequencyRollup } from "./strict-frequency-rollup.js";

test("StrictFrequencyRollupView shows the status in capitals", () => {
  const item = newStrictFrequencyRollup("code-676", "label-172");
  const view = toStrictFrequencyRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFrequencyRollupViews([item, item]).length, 2, "views");
});
