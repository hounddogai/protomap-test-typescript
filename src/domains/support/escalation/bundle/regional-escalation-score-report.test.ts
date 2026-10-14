import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalEscalationScoreReport } from "./regional-escalation-score-report.js";
import { RegionalEscalationScore, newRegionalEscalationScore } from "./regional-escalation-score.js";

test("RegionalEscalationScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_537_000);
  const items: RegionalEscalationScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalEscalationScore(`regional-escalation-score-${index}`, "sample"));
  }
  const report = buildRegionalEscalationScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
