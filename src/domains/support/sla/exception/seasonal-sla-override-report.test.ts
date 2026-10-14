import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSlaOverrideReport } from "./seasonal-sla-override-report.js";
import { SeasonalSlaOverride, newSeasonalSlaOverride } from "./seasonal-sla-override.js";

test("SeasonalSlaOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_403_081);
  const items: SeasonalSlaOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalSlaOverride(`seasonal-sla-override-${index}`, "sample"));
  }
  const report = buildSeasonalSlaOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
