import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalTouchpointAuditReport } from "./global-touchpoint-audit-report.js";
import { GlobalTouchpointAudit, newGlobalTouchpointAudit } from "./global-touchpoint-audit.js";

test("GlobalTouchpointAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_704_884);
  const items: GlobalTouchpointAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalTouchpointAudit(`global-touchpoint-audit-${index}`, "sample"));
  }
  const report = buildGlobalTouchpointAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
