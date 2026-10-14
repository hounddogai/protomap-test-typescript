import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionAuditReport } from "./conversion-audit-report.js";
import { ConversionAudit, newConversionAudit } from "./conversion-audit.js";

test("ConversionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_841_666);
  const items: ConversionAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newConversionAudit(`conversion-audit-${index}`, "sample"));
  }
  const report = buildConversionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
