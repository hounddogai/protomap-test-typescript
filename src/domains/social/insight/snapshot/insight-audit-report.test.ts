import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightAuditReport } from "./insight-audit-report.js";
import { InsightAudit, newInsightAudit } from "./insight-audit.js";

test("InsightAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_115_386);
  const items: InsightAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInsightAudit(`insight-audit-${index}`, "sample"));
  }
  const report = buildInsightAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
