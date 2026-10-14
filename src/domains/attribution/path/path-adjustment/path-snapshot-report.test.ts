import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathSnapshotReport } from "./path-snapshot-report.js";
import { PathSnapshot, newPathSnapshot } from "./path-snapshot.js";

test("PathSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_640_620);
  const items: PathSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathSnapshot(`path-snapshot-${index}`, "sample"));
  }
  const report = buildPathSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
