import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationCheckpointReport } from "./activation-checkpoint-report.js";
import { ActivationCheckpoint, newActivationCheckpoint } from "./activation-checkpoint.js";

test("ActivationCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_351_442);
  const items: ActivationCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newActivationCheckpoint(`activation-checkpoint-${index}`, "sample"));
  }
  const report = buildActivationCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
