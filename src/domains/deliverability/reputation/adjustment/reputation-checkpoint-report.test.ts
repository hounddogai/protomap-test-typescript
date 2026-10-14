import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationCheckpointReport } from "./reputation-checkpoint-report.js";
import { ReputationCheckpoint, newReputationCheckpoint } from "./reputation-checkpoint.js";

test("ReputationCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_631_269);
  const items: ReputationCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReputationCheckpoint(`reputation-checkpoint-${index}`, "sample"));
  }
  const report = buildReputationCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
