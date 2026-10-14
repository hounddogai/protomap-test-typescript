import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredLeaderboardMappingReport } from "./tiered-leaderboard-mapping-report.js";
import { TieredLeaderboardMapping, newTieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

test("TieredLeaderboardMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_538_654);
  const items: TieredLeaderboardMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredLeaderboardMapping(`tiered-leaderboard-mapping-${index}`, "sample"));
  }
  const report = buildTieredLeaderboardMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
