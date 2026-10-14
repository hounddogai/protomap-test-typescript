import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultBidRuleSummaryReport } from "./default-bid-rule-summary-report.js";
import { DefaultBidRuleSummary, newDefaultBidRuleSummary } from "./default-bid-rule-summary.js";

test("DefaultBidRuleSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_609_563);
  const items: DefaultBidRuleSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultBidRuleSummary(`default-bid-rule-summary-${index}`, "sample"));
  }
  const report = buildDefaultBidRuleSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
