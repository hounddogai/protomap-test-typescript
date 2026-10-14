import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalDoubleOptInBatchView,
  toSeasonalDoubleOptInBatchViews,
} from "./seasonal-double-opt-in-batch-view.js";
import { newSeasonalDoubleOptInBatch } from "./seasonal-double-opt-in-batch.js";

test("SeasonalDoubleOptInBatchView shows the status in capitals", () => {
  const item = newSeasonalDoubleOptInBatch("code-512", "label-128");
  const view = toSeasonalDoubleOptInBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalDoubleOptInBatchViews([item, item]).length, 2, "views");
});
