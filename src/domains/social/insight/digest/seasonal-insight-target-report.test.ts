import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalInsightTargetReport } from "./seasonal-insight-target-report.js";
import { SeasonalInsightTarget, newSeasonalInsightTarget } from "./seasonal-insight-target.js";

test("SeasonalInsightTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_030_992);
  const items: SeasonalInsightTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalInsightTarget(`seasonal-insight-target-${index}`, "sample"));
  }
  const report = buildSeasonalInsightTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
