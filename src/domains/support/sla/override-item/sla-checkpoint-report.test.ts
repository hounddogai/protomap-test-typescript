import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaCheckpointReport } from "./sla-checkpoint-report.js";
import { SlaCheckpoint, newSlaCheckpoint } from "./sla-checkpoint.js";

test("SlaCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_462_153);
  const items: SlaCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSlaCheckpoint(`sla-checkpoint-${index}`, "sample"));
  }
  const report = buildSlaCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
