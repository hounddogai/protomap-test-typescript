import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationCheckpointReport } from "./escalation-checkpoint-report.js";
import { EscalationCheckpoint, newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("EscalationCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_685_955);
  const items: EscalationCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newEscalationCheckpoint(`escalation-checkpoint-${index}`, "sample"));
  }
  const report = buildEscalationCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
