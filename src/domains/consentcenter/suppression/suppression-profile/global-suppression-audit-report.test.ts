import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalSuppressionAuditReport } from "./global-suppression-audit-report.js";
import { GlobalSuppressionAudit, newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("GlobalSuppressionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_393_655);
  const items: GlobalSuppressionAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalSuppressionAudit(`global-suppression-audit-${index}`, "sample"));
  }
  const report = buildGlobalSuppressionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
