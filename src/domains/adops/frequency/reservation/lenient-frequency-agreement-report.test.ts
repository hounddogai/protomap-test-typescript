import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientFrequencyAgreementReport } from "./lenient-frequency-agreement-report.js";
import { LenientFrequencyAgreement, newLenientFrequencyAgreement } from "./lenient-frequency-agreement.js";

test("LenientFrequencyAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_427_443);
  const items: LenientFrequencyAgreement[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientFrequencyAgreement(`lenient-frequency-agreement-${index}`, "sample"));
  }
  const report = buildLenientFrequencyAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
