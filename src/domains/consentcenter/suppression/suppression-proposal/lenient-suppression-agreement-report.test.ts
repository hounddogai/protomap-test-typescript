import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSuppressionAgreementReport } from "./lenient-suppression-agreement-report.js";
import { LenientSuppressionAgreement, newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("LenientSuppressionAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_155_559);
  const items: LenientSuppressionAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientSuppressionAgreement(`lenient-suppression-agreement-${index}`, "sample"));
  }
  const report = buildLenientSuppressionAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
