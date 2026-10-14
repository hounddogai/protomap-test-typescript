import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalLevelAuditReport } from "./seasonal-level-audit-report.js";
import { SeasonalLevelAudit, newSeasonalLevelAudit } from "./seasonal-level-audit.js";

test("SeasonalLevelAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_574_934);
  const items: SeasonalLevelAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalLevelAudit(`seasonal-level-audit-${index}`, "sample"));
  }
  const report = buildSeasonalLevelAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
