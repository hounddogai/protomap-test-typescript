import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedJourneyAgreementReport } from "./weighted-journey-agreement-report.js";
import { WeightedJourneyAgreement, newWeightedJourneyAgreement } from "./weighted-journey-agreement.js";

test("WeightedJourneyAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_775_833);
  const items: WeightedJourneyAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedJourneyAgreement(`weighted-journey-agreement-${index}`, "sample"));
  }
  const report = buildWeightedJourneyAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
