import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingBadgeAuditReport } from "./pending-badge-audit-report.js";
import { PendingBadgeAudit, newPendingBadgeAudit } from "./pending-badge-audit.js";

test("PendingBadgeAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_544_892);
  const items: PendingBadgeAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingBadgeAudit(`pending-badge-audit-${index}`, "sample"));
  }
  const report = buildPendingBadgeAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
