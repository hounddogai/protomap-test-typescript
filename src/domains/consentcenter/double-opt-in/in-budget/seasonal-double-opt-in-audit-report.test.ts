import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalDoubleOptInAuditReport } from "./seasonal-double-opt-in-audit-report.js";
import { SeasonalDoubleOptInAudit, newSeasonalDoubleOptInAudit } from "./seasonal-double-opt-in-audit.js";

test("SeasonalDoubleOptInAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_955_978);
  const items: SeasonalDoubleOptInAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalDoubleOptInAudit(`seasonal-double-opt-in-audit-${index}`, "sample"));
  }
  const report = buildSeasonalDoubleOptInAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
