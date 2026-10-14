import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingStreakAuditReport } from "./pending-streak-audit-report.js";
import { PendingStreakAudit, newPendingStreakAudit } from "./pending-streak-audit.js";

test("PendingStreakAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_032_188);
  const items: PendingStreakAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingStreakAudit(`pending-streak-audit-${index}`, "sample"));
  }
  const report = buildPendingStreakAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
