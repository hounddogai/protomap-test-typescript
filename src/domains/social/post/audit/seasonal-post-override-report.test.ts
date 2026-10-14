import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPostOverrideReport } from "./seasonal-post-override-report.js";
import { SeasonalPostOverride, newSeasonalPostOverride } from "./seasonal-post-override.js";

test("SeasonalPostOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_559_160);
  const items: SeasonalPostOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalPostOverride(`seasonal-post-override-${index}`, "sample"));
  }
  const report = buildSeasonalPostOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
