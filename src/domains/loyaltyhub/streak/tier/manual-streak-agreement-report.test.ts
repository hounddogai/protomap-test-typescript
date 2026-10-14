import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualStreakAgreementReport } from "./manual-streak-agreement-report.js";
import { ManualStreakAgreement, newManualStreakAgreement } from "./manual-streak-agreement.js";

test("ManualStreakAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_078_437);
  const items: ManualStreakAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualStreakAgreement(`manual-streak-agreement-${index}`, "sample"));
  }
  const report = buildManualStreakAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
