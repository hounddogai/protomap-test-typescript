import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalWindowAuditReport } from "./global-window-audit-report.js";
import { GlobalWindowAudit, newGlobalWindowAudit } from "./global-window-audit.js";

test("GlobalWindowAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_213_123);
  const items: GlobalWindowAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalWindowAudit(`global-window-audit-${index}`, "sample"));
  }
  const report = buildGlobalWindowAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
