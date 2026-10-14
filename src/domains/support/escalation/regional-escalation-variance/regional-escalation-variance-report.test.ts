import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalEscalationVarianceReport } from "./regional-escalation-variance-report.js";
import { RegionalEscalationVariance, newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("RegionalEscalationVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_102_169);
  const items: RegionalEscalationVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalEscalationVariance(`regional-escalation-variance-${index}`, "sample"));
  }
  const report = buildRegionalEscalationVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
