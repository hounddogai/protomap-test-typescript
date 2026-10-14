import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneyAgreementReport } from "./rolling-journey-agreement-report.js";
import { RollingJourneyAgreement, newRollingJourneyAgreement } from "./rolling-journey-agreement.js";

test("RollingJourneyAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_937_582);
  const items: RollingJourneyAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingJourneyAgreement(`rolling-journey-agreement-${index}`, "sample"));
  }
  const report = buildRollingJourneyAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
