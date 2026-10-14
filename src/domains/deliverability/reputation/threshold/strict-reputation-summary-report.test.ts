import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictReputationSummaryReport } from "./strict-reputation-summary-report.js";
import { StrictReputationSummary, newStrictReputationSummary } from "./strict-reputation-summary.js";

test("StrictReputationSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_999_922);
  const items: StrictReputationSummary[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictReputationSummary(`strict-reputation-summary-${index}`, "sample"));
  }
  const report = buildStrictReputationSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
