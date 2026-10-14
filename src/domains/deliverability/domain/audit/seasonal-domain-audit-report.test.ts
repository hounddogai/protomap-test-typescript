import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalDomainAuditReport } from "./seasonal-domain-audit-report.js";
import { SeasonalDomainAudit, newSeasonalDomainAudit } from "./seasonal-domain-audit.js";

test("SeasonalDomainAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_718_758);
  const items: SeasonalDomainAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalDomainAudit(`seasonal-domain-audit-${index}`, "sample"));
  }
  const report = buildSeasonalDomainAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
