import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalWindowAuditReport } from "./regional-window-audit-report.js";
import { RegionalWindowAudit, newRegionalWindowAudit } from "./regional-window-audit.js";

test("RegionalWindowAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_144_748);
  const items: RegionalWindowAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalWindowAudit(`regional-window-audit-${index}`, "sample"));
  }
  const report = buildRegionalWindowAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
