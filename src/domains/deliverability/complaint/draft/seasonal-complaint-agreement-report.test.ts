import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalComplaintAgreementReport } from "./seasonal-complaint-agreement-report.js";
import { SeasonalComplaintAgreement, newSeasonalComplaintAgreement } from "./seasonal-complaint-agreement.js";

test("SeasonalComplaintAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_099_746);
  const items: SeasonalComplaintAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalComplaintAgreement(`seasonal-complaint-agreement-${index}`, "sample"));
  }
  const report = buildSeasonalComplaintAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
