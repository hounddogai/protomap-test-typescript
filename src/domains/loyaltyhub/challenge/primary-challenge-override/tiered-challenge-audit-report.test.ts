import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredChallengeAuditReport } from "./tiered-challenge-audit-report.js";
import { TieredChallengeAudit, newTieredChallengeAudit } from "./tiered-challenge-audit.js";

test("TieredChallengeAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_792_685);
  const items: TieredChallengeAudit[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredChallengeAudit(`tiered-challenge-audit-${index}`, "sample"));
  }
  const report = buildTieredChallengeAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
