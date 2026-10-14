import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyAuditReport } from "./journey-audit-report.js";
import { JourneyAudit, newJourneyAudit } from "./journey-audit.js";

test("JourneyAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_386_791);
  const items: JourneyAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newJourneyAudit(`journey-audit-${index}`, "sample"));
  }
  const report = buildJourneyAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
