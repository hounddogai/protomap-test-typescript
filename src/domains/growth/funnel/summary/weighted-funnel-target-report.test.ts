import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedFunnelTargetReport } from "./weighted-funnel-target-report.js";
import { WeightedFunnelTarget, newWeightedFunnelTarget } from "./weighted-funnel-target.js";

test("WeightedFunnelTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_371_266);
  const items: WeightedFunnelTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedFunnelTarget(`weighted-funnel-target-${index}`, "sample"));
  }
  const report = buildWeightedFunnelTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
