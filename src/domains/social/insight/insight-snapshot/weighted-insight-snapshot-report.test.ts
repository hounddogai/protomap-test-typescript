import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedInsightSnapshotReport } from "./weighted-insight-snapshot-report.js";
import { WeightedInsightSnapshot, newWeightedInsightSnapshot } from "./weighted-insight-snapshot.js";

test("WeightedInsightSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_518_766);
  const items: WeightedInsightSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedInsightSnapshot(`weighted-insight-snapshot-${index}`, "sample"));
  }
  const report = buildWeightedInsightSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
