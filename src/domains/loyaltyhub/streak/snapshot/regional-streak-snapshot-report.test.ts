import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalStreakSnapshotReport } from "./regional-streak-snapshot-report.js";
import { RegionalStreakSnapshot, newRegionalStreakSnapshot } from "./regional-streak-snapshot.js";

test("RegionalStreakSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_181_147);
  const items: RegionalStreakSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalStreakSnapshot(`regional-streak-snapshot-${index}`, "sample"));
  }
  const report = buildRegionalStreakSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
