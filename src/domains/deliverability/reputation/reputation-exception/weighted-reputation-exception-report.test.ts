import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedReputationExceptionReport } from "./weighted-reputation-exception-report.js";
import { WeightedReputationException, newWeightedReputationException } from "./weighted-reputation-exception.js";

test("WeightedReputationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_886_202);
  const items: WeightedReputationException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedReputationException(`weighted-reputation-exception-${index}`, "sample"));
  }
  const report = buildWeightedReputationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
