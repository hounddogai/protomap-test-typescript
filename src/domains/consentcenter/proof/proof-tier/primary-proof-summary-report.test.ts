import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryProofSummaryReport } from "./primary-proof-summary-report.js";
import { PrimaryProofSummary, newPrimaryProofSummary } from "./primary-proof-summary.js";

test("PrimaryProofSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_490_246);
  const items: PrimaryProofSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryProofSummary(`primary-proof-summary-${index}`, "sample"));
  }
  const report = buildPrimaryProofSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
