import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveFlightSnapshotReport } from "./adaptive-flight-snapshot-report.js";
import { AdaptiveFlightSnapshot, newAdaptiveFlightSnapshot } from "./adaptive-flight-snapshot.js";

test("AdaptiveFlightSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_631_212);
  const items: AdaptiveFlightSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveFlightSnapshot(`adaptive-flight-snapshot-${index}`, "sample"));
  }
  const report = buildAdaptiveFlightSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
