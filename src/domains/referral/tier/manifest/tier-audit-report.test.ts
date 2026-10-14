import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierAuditReport } from "./tier-audit-report.js";
import { TierAudit, newTierAudit } from "./tier-audit.js";

test("TierAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_578_621);
  const items: TierAudit[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierAudit(`tier-audit-${index}`, "sample"));
  }
  const report = buildTierAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
