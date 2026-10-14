import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTouchpointSnapshotReport } from "./capped-touchpoint-snapshot-report.js";
import { CappedTouchpointSnapshot, newCappedTouchpointSnapshot } from "./capped-touchpoint-snapshot.js";

test("CappedTouchpointSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_901_654);
  const items: CappedTouchpointSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedTouchpointSnapshot(`capped-touchpoint-snapshot-${index}`, "sample"));
  }
  const report = buildCappedTouchpointSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
