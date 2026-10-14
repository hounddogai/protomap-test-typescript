import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalBidRuleForecastReport } from "./seasonal-bid-rule-forecast-report.js";
import { SeasonalBidRuleForecast, newSeasonalBidRuleForecast } from "./seasonal-bid-rule-forecast.js";

test("SeasonalBidRuleForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_672_146);
  const items: SeasonalBidRuleForecast[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalBidRuleForecast(`seasonal-bid-rule-forecast-${index}`, "sample"));
  }
  const report = buildSeasonalBidRuleForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
