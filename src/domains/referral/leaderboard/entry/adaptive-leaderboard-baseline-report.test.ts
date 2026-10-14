import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveLeaderboardBaselineReport } from "./adaptive-leaderboard-baseline-report.js";
import { AdaptiveLeaderboardBaseline, newAdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

test("AdaptiveLeaderboardBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_840_822);
  const items: AdaptiveLeaderboardBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveLeaderboardBaseline(`adaptive-leaderboard-baseline-${index}`, "sample"));
  }
  const report = buildAdaptiveLeaderboardBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
