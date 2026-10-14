import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalEscalationRollupReport } from "./seasonal-escalation-rollup-report.js";
import { SeasonalEscalationRollup, newSeasonalEscalationRollup } from "./seasonal-escalation-rollup.js";

test("SeasonalEscalationRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_020_453);
  const items: SeasonalEscalationRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalEscalationRollup(`seasonal-escalation-rollup-${index}`, "sample"));
  }
  const report = buildSeasonalEscalationRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
