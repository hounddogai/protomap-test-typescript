import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredNudgeSnapshotReport } from "./tiered-nudge-snapshot-report.js";
import { TieredNudgeSnapshot, newTieredNudgeSnapshot } from "./tiered-nudge-snapshot.js";

test("TieredNudgeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_221_977);
  const items: TieredNudgeSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredNudgeSnapshot(`tiered-nudge-snapshot-${index}`, "sample"));
  }
  const report = buildTieredNudgeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
