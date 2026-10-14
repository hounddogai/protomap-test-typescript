import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryConversionAuditReport } from "./primary-conversion-audit-report.js";
import { PrimaryConversionAudit, newPrimaryConversionAudit } from "./primary-conversion-audit.js";

test("PrimaryConversionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_774_744);
  const items: PrimaryConversionAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryConversionAudit(`primary-conversion-audit-${index}`, "sample"));
  }
  const report = buildPrimaryConversionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
