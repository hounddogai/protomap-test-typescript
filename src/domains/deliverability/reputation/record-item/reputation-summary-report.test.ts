import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationSummaryReport } from "./reputation-summary-report.js";
import { ReputationSummary, newReputationSummary } from "./reputation-summary.js";

test("ReputationSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_330_764);
  const items: ReputationSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReputationSummary(`reputation-summary-${index}`, "sample"));
  }
  const report = buildReputationSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
