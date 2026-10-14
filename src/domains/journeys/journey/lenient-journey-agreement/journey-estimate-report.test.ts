import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyEstimateReport } from "./journey-estimate-report.js";
import { JourneyEstimate, newJourneyEstimate } from "./journey-estimate.js";

test("JourneyEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_478_431);
  const items: JourneyEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newJourneyEstimate(`journey-estimate-${index}`, "sample"));
  }
  const report = buildJourneyEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
