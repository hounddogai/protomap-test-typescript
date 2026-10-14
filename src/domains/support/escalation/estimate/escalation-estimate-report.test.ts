import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationEstimateReport } from "./escalation-estimate-report.js";
import { EscalationEstimate, newEscalationEstimate } from "./escalation-estimate.js";

test("EscalationEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_020_967);
  const items: EscalationEstimate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEscalationEstimate(`escalation-estimate-${index}`, "sample"));
  }
  const report = buildEscalationEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
