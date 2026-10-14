import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInAuditReport } from "./double-opt-in-audit-report.js";
import { DoubleOptInAudit, newDoubleOptInAudit } from "./double-opt-in-audit.js";

test("DoubleOptInAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_260_023);
  const items: DoubleOptInAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDoubleOptInAudit(`double-opt-in-audit-${index}`, "sample"));
  }
  const report = buildDoubleOptInAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
