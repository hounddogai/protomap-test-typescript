import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyNudgeForecastReport } from "./legacy-nudge-forecast-report.js";
import { LegacyNudgeForecast, newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

test("LegacyNudgeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_049_408);
  const items: LegacyNudgeForecast[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyNudgeForecast(`legacy-nudge-forecast-${index}`, "sample"));
  }
  const report = buildLegacyNudgeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
