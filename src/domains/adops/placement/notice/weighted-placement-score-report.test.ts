import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPlacementScoreReport } from "./weighted-placement-score-report.js";
import { WeightedPlacementScore, newWeightedPlacementScore } from "./weighted-placement-score.js";

test("WeightedPlacementScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_604_406);
  const items: WeightedPlacementScore[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedPlacementScore(`weighted-placement-score-${index}`, "sample"));
  }
  const report = buildWeightedPlacementScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
