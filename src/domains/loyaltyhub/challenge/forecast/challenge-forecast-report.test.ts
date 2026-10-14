import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeForecastReport } from "./challenge-forecast-report.js";
import { ChallengeForecast, newChallengeForecast } from "./challenge-forecast.js";

test("ChallengeForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_978_018);
  const items: ChallengeForecast[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newChallengeForecast(`challenge-forecast-${index}`, "sample"));
  }
  const report = buildChallengeForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
