import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledTouchpointAuditReport } from "./scheduled-touchpoint-audit-report.js";
import { ScheduledTouchpointAudit, newScheduledTouchpointAudit } from "./scheduled-touchpoint-audit.js";

test("ScheduledTouchpointAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_061_581);
  const items: ScheduledTouchpointAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledTouchpointAudit(`scheduled-touchpoint-audit-${index}`, "sample"));
  }
  const report = buildScheduledTouchpointAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
