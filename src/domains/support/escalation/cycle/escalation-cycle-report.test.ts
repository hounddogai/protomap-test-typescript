import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationCycleReport } from "./escalation-cycle-report.js";
import { EscalationCycle, newEscalationCycle } from "./escalation-cycle.js";

test("EscalationCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_936_162);
  const items: EscalationCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEscalationCycle(`escalation-cycle-${index}`, "sample"));
  }
  const report = buildEscalationCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
