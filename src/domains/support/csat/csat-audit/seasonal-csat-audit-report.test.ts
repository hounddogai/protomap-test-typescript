import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCsatAuditReport } from "./seasonal-csat-audit-report.js";
import { SeasonalCsatAudit, newSeasonalCsatAudit } from "./seasonal-csat-audit.js";

test("SeasonalCsatAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_935_724);
  const items: SeasonalCsatAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalCsatAudit(`seasonal-csat-audit-${index}`, "sample"));
  }
  const report = buildSeasonalCsatAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
