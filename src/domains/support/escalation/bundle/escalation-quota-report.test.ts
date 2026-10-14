import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationQuotaReport } from "./escalation-quota-report.js";
import { EscalationQuota, newEscalationQuota } from "./escalation-quota.js";

test("EscalationQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_099_520);
  const items: EscalationQuota[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEscalationQuota(`escalation-quota-${index}`, "sample"));
  }
  const report = buildEscalationQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
