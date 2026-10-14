import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveModelAuditReport } from "./adaptive-model-audit-report.js";
import { AdaptiveModelAudit, newAdaptiveModelAudit } from "./adaptive-model-audit.js";

test("AdaptiveModelAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_301_703);
  const items: AdaptiveModelAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveModelAudit(`adaptive-model-audit-${index}`, "sample"));
  }
  const report = buildAdaptiveModelAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
