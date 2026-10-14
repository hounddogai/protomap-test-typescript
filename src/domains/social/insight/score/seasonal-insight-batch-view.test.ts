import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalInsightBatchView, toSeasonalInsightBatchViews } from "./seasonal-insight-batch-view.js";
import { newSeasonalInsightBatch } from "./seasonal-insight-batch.js";

test("SeasonalInsightBatchView shows the status in capitals", () => {
  const item = newSeasonalInsightBatch("code-313", "name-180");
  const view = toSeasonalInsightBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalInsightBatchViews([item, item]).length, 2, "views");
});
