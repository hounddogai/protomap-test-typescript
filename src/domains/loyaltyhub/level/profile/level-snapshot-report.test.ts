import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelSnapshotReport } from "./level-snapshot-report.js";
import { LevelSnapshot, newLevelSnapshot } from "./level-snapshot.js";

test("LevelSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_343_737);
  const items: LevelSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLevelSnapshot(`level-snapshot-${index}`, "sample"));
  }
  const report = buildLevelSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
