import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualRetentionAgreementReport } from "./manual-retention-agreement-report.js";
import { ManualRetentionAgreement, newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("ManualRetentionAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_387_370);
  const items: ManualRetentionAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualRetentionAgreement(`manual-retention-agreement-${index}`, "sample"));
  }
  const report = buildManualRetentionAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
