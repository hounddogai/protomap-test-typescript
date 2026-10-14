import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointAuditReport } from "./touchpoint-audit-report.js";
import { TouchpointAudit, newTouchpointAudit } from "./touchpoint-audit.js";

test("TouchpointAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_559_840);
  const items: TouchpointAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTouchpointAudit(`touchpoint-audit-${index}`, "sample"));
  }
  const report = buildTouchpointAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
