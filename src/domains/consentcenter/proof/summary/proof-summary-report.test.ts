import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofSummaryReport } from "./proof-summary-report.js";
import { ProofSummary, newProofSummary } from "./proof-summary.js";

test("ProofSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_948_465);
  const items: ProofSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newProofSummary(`proof-summary-${index}`, "sample"));
  }
  const report = buildProofSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
