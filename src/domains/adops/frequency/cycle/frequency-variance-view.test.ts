import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyVarianceView, toFrequencyVarianceViews } from "./frequency-variance-view.js";
import { newFrequencyVariance } from "./frequency-variance.js";

test("FrequencyVarianceView shows the status in capitals", () => {
  const item = newFrequencyVariance("code-53", "name-945");
  const view = toFrequencyVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyVarianceViews([item, item]).length, 2, "views");
});
