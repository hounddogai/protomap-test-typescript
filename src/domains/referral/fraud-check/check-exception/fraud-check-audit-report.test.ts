import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckAuditReport } from "./fraud-check-audit-report.js";
import { FraudCheckAudit, newFraudCheckAudit } from "./fraud-check-audit.js";

test("FraudCheckAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_896_681);
  const items: FraudCheckAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFraudCheckAudit(`fraud-check-audit-${index}`, "sample"));
  }
  const report = buildFraudCheckAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
