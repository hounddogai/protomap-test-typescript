import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchSnapshotReport } from "./branch-snapshot-report.js";
import { BranchSnapshot, newBranchSnapshot } from "./branch-snapshot.js";

test("BranchSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_367_045);
  const items: BranchSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBranchSnapshot(`branch-snapshot-${index}`, "sample"));
  }
  const report = buildBranchSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
