import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleAuditReport } from "./bid-rule-audit-report.js";
import { BidRuleAudit, newBidRuleAudit } from "./bid-rule-audit.js";

test("BidRuleAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_654_929);
  const items: BidRuleAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBidRuleAudit(`bid-rule-audit-${index}`, "sample"));
  }
  const report = buildBidRuleAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
