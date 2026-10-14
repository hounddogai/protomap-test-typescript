import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelSnapshotReport } from "./model-snapshot-report.js";
import { ModelSnapshot, newModelSnapshot } from "./model-snapshot.js";

test("ModelSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_234_604);
  const items: ModelSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newModelSnapshot(`model-snapshot-${index}`, "sample"));
  }
  const report = buildModelSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
