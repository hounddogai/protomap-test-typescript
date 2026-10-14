import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingInsightSnapshotReport } from "./rolling-insight-snapshot-report.js";
import { RollingInsightSnapshot, newRollingInsightSnapshot } from "./rolling-insight-snapshot.js";

test("RollingInsightSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_333_764);
  const items: RollingInsightSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingInsightSnapshot(`rolling-insight-snapshot-${index}`, "sample"));
  }
  const report = buildRollingInsightSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
