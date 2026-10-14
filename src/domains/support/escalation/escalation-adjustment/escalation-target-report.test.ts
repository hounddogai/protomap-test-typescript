import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationTargetReport } from "./escalation-target-report.js";
import { EscalationTarget, newEscalationTarget } from "./escalation-target.js";

test("EscalationTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_516_051);
  const items: EscalationTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEscalationTarget(`escalation-target-${index}`, "sample"));
  }
  const report = buildEscalationTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
