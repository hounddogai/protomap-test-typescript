import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPaywallAuditReport } from "./pending-paywall-audit-report.js";
import { PendingPaywallAudit, newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("PendingPaywallAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_089_730);
  const items: PendingPaywallAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingPaywallAudit(`pending-paywall-audit-${index}`, "sample"));
  }
  const report = buildPendingPaywallAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
