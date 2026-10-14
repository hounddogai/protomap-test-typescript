import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientLeaderboardSegmentReport } from "./lenient-leaderboard-segment-report.js";
import { LenientLeaderboardSegment, newLenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

test("LenientLeaderboardSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_108_888);
  const items: LenientLeaderboardSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientLeaderboardSegment(`lenient-leaderboard-segment-${index}`, "sample"));
  }
  const report = buildLenientLeaderboardSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
