import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSlaVarianceReport } from "./seasonal-sla-variance-report.js";
import { SeasonalSlaVariance, newSeasonalSlaVariance } from "./seasonal-sla-variance.js";

test("SeasonalSlaVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_662_954);
  const items: SeasonalSlaVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalSlaVariance(`seasonal-sla-variance-${index}`, "sample"));
  }
  const report = buildSeasonalSlaVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
