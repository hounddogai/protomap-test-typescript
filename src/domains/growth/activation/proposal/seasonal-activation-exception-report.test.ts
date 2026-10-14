import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalActivationExceptionReport } from "./seasonal-activation-exception-report.js";
import { SeasonalActivationException, newSeasonalActivationException } from "./seasonal-activation-exception.js";

test("SeasonalActivationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_648_044);
  const items: SeasonalActivationException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalActivationException(`seasonal-activation-exception-${index}`, "sample"));
  }
  const report = buildSeasonalActivationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
