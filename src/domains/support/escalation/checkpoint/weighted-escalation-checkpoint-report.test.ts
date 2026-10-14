import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedEscalationCheckpointReport } from "./weighted-escalation-checkpoint-report.js";
import { WeightedEscalationCheckpoint, newWeightedEscalationCheckpoint } from "./weighted-escalation-checkpoint.js";

test("WeightedEscalationCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_065_593);
  const items: WeightedEscalationCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedEscalationCheckpoint(`weighted-escalation-checkpoint-${index}`, "sample"));
  }
  const report = buildWeightedEscalationCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
