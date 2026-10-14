import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallAuditReport } from "./paywall-audit-report.js";
import { PaywallAudit, newPaywallAudit } from "./paywall-audit.js";

test("PaywallAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_340_917);
  const items: PaywallAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPaywallAudit(`paywall-audit-${index}`, "sample"));
  }
  const report = buildPaywallAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
