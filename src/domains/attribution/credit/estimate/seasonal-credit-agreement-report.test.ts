import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreditAgreementReport } from "./seasonal-credit-agreement-report.js";
import { SeasonalCreditAgreement, newSeasonalCreditAgreement } from "./seasonal-credit-agreement.js";

test("SeasonalCreditAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_062_042);
  const items: SeasonalCreditAgreement[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalCreditAgreement(`seasonal-credit-agreement-${index}`, "sample"));
  }
  const report = buildSeasonalCreditAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
