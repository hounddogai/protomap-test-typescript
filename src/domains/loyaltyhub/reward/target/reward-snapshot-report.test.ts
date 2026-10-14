import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardSnapshotReport } from "./reward-snapshot-report.js";
import { RewardSnapshot, newRewardSnapshot } from "./reward-snapshot.js";

test("RewardSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_563_508);
  const items: RewardSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardSnapshot(`reward-snapshot-${index}`, "sample"));
  }
  const report = buildRewardSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
