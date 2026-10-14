import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRetentionForecastReport } from "./tiered-retention-forecast-report.js";
import { TieredRetentionForecast, newTieredRetentionForecast } from "./tiered-retention-forecast.js";

test("TieredRetentionForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_002_194);
  const items: TieredRetentionForecast[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredRetentionForecast(`tiered-retention-forecast-${index}`, "sample"));
  }
  const report = buildTieredRetentionForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
