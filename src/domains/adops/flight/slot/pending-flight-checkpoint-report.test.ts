import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFlightCheckpointReport } from "./pending-flight-checkpoint-report.js";
import { PendingFlightCheckpoint, newPendingFlightCheckpoint } from "./pending-flight-checkpoint.js";

test("PendingFlightCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_681_121);
  const items: PendingFlightCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingFlightCheckpoint(`pending-flight-checkpoint-${index}`, "sample"));
  }
  const report = buildPendingFlightCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
