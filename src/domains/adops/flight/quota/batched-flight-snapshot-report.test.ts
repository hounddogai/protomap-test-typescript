import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedFlightSnapshotReport } from "./batched-flight-snapshot-report.js";
import { BatchedFlightSnapshot, newBatchedFlightSnapshot } from "./batched-flight-snapshot.js";

test("BatchedFlightSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_718_801);
  const items: BatchedFlightSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedFlightSnapshot(`batched-flight-snapshot-${index}`, "sample"));
  }
  const report = buildBatchedFlightSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
