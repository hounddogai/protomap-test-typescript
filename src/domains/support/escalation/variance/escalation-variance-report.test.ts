import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationVarianceReport } from "./escalation-variance-report.js";
import { EscalationVariance, newEscalationVariance } from "./escalation-variance.js";

test("EscalationVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_961_199);
  const items: EscalationVariance[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEscalationVariance(`escalation-variance-${index}`, "sample"));
  }
  const report = buildEscalationVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
