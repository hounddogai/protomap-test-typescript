import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionAuditReport } from "./subscription-audit-report.js";
import { SubscriptionAudit, newSubscriptionAudit } from "./subscription-audit.js";

test("SubscriptionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_856_851);
  const items: SubscriptionAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSubscriptionAudit(`subscription-audit-${index}`, "sample"));
  }
  const report = buildSubscriptionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
