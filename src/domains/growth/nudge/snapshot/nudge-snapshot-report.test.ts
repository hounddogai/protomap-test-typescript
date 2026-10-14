import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeSnapshotReport } from "./nudge-snapshot-report.js";
import { NudgeSnapshot, newNudgeSnapshot } from "./nudge-snapshot.js";

test("NudgeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_036_052);
  const items: NudgeSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newNudgeSnapshot(`nudge-snapshot-${index}`, "sample"));
  }
  const report = buildNudgeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
