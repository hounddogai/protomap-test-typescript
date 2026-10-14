import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedMentionAuditReport } from "./weighted-mention-audit-report.js";
import { WeightedMentionAudit, newWeightedMentionAudit } from "./weighted-mention-audit.js";

test("WeightedMentionAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_330_314);
  const items: WeightedMentionAudit[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedMentionAudit(`weighted-mention-audit-${index}`, "sample"));
  }
  const report = buildWeightedMentionAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
