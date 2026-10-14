import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalModelAuditReport } from "./regional-model-audit-report.js";
import { RegionalModelAudit, newRegionalModelAudit } from "./regional-model-audit.js";

test("RegionalModelAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_296_440);
  const items: RegionalModelAudit[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalModelAudit(`regional-model-audit-${index}`, "sample"));
  }
  const report = buildRegionalModelAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
