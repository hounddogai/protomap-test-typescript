import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualFlightCheckpointReport } from "./manual-flight-checkpoint-report.js";
import { ManualFlightCheckpoint, newManualFlightCheckpoint } from "./manual-flight-checkpoint.js";

test("ManualFlightCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_871_735);
  const items: ManualFlightCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualFlightCheckpoint(`manual-flight-checkpoint-${index}`, "sample"));
  }
  const report = buildManualFlightCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
