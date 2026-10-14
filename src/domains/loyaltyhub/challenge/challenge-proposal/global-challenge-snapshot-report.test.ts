import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalChallengeSnapshotReport } from "./global-challenge-snapshot-report.js";
import { GlobalChallengeSnapshot, newGlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

test("GlobalChallengeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_029_614);
  const items: GlobalChallengeSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalChallengeSnapshot(`global-challenge-snapshot-${index}`, "sample"));
  }
  const report = buildGlobalChallengeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
