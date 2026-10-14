import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingBidRuleAuditReport } from "./rolling-bid-rule-audit-report.js";
import { RollingBidRuleAudit, newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

test("RollingBidRuleAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_687_692);
  const items: RollingBidRuleAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingBidRuleAudit(`rolling-bid-rule-audit-${index}`, "sample"));
  }
  const report = buildRollingBidRuleAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
