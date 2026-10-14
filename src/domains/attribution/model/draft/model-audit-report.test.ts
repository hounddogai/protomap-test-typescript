import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelAuditReport } from "./model-audit-report.js";
import { ModelAudit, newModelAudit } from "./model-audit.js";

test("ModelAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_313_999);
  const items: ModelAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newModelAudit(`model-audit-${index}`, "sample"));
  }
  const report = buildModelAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
