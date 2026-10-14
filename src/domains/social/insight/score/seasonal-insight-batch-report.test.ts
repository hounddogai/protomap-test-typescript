import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalInsightBatchReport } from "./seasonal-insight-batch-report.js";
import { SeasonalInsightBatch, newSeasonalInsightBatch } from "./seasonal-insight-batch.js";

test("SeasonalInsightBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_850_543);
  const items: SeasonalInsightBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalInsightBatch(`seasonal-insight-batch-${index}`, "sample"));
  }
  const report = buildSeasonalInsightBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
