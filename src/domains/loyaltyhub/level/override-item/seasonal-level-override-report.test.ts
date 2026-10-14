import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalLevelOverrideReport } from "./seasonal-level-override-report.js";
import { SeasonalLevelOverride, newSeasonalLevelOverride } from "./seasonal-level-override.js";

test("SeasonalLevelOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_812_989);
  const items: SeasonalLevelOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalLevelOverride(`seasonal-level-override-${index}`, "sample"));
  }
  const report = buildSeasonalLevelOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
