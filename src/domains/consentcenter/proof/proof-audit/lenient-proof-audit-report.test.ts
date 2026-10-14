import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientProofAuditReport } from "./lenient-proof-audit-report.js";
import { LenientProofAudit, newLenientProofAudit } from "./lenient-proof-audit.js";

test("LenientProofAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_806_279);
  const items: LenientProofAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientProofAudit(`lenient-proof-audit-${index}`, "sample"));
  }
  const report = buildLenientProofAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
