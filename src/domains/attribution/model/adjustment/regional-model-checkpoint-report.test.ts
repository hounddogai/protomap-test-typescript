import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalModelCheckpointReport } from "./regional-model-checkpoint-report.js";
import { RegionalModelCheckpoint, newRegionalModelCheckpoint } from "./regional-model-checkpoint.js";

test("RegionalModelCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_127_412);
  const items: RegionalModelCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalModelCheckpoint(`regional-model-checkpoint-${index}`, "sample"));
  }
  const report = buildRegionalModelCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
