import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementEstimateReport } from "./placement-estimate-report.js";
import { PlacementEstimate, newPlacementEstimate } from "./placement-estimate.js";

test("PlacementEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_622_126);
  const items: PlacementEstimate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPlacementEstimate(`placement-estimate-${index}`, "sample"));
  }
  const report = buildPlacementEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
