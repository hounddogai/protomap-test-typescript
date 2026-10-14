import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualCreativeAuditReport } from "./manual-creative-audit-report.js";
import { ManualCreativeAudit, newManualCreativeAudit } from "./manual-creative-audit.js";

test("ManualCreativeAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_072_672);
  const items: ManualCreativeAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualCreativeAudit(`manual-creative-audit-${index}`, "sample"));
  }
  const report = buildManualCreativeAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
