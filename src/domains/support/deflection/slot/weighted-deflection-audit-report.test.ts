import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDeflectionAuditReport } from "./weighted-deflection-audit-report.js";
import { WeightedDeflectionAudit, newWeightedDeflectionAudit } from "./weighted-deflection-audit.js";

test("WeightedDeflectionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_557_511);
  const items: WeightedDeflectionAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedDeflectionAudit(`weighted-deflection-audit-${index}`, "sample"));
  }
  const report = buildWeightedDeflectionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
