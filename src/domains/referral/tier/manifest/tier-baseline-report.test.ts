import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierBaselineReport } from "./tier-baseline-report.js";
import { TierBaseline, newTierBaseline } from "./tier-baseline.js";

test("TierBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_292_265);
  const items: TierBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTierBaseline(`tier-baseline-${index}`, "sample"));
  }
  const report = buildTierBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
