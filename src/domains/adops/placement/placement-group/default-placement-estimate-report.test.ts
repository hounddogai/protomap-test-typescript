import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPlacementEstimateReport } from "./default-placement-estimate-report.js";
import { DefaultPlacementEstimate, newDefaultPlacementEstimate } from "./default-placement-estimate.js";

test("DefaultPlacementEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_093_037);
  const items: DefaultPlacementEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultPlacementEstimate(`default-placement-estimate-${index}`, "sample"));
  }
  const report = buildDefaultPlacementEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
