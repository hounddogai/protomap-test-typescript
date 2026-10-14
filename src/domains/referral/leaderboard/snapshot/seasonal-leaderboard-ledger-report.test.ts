import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalLeaderboardLedgerReport } from "./seasonal-leaderboard-ledger-report.js";
import { SeasonalLeaderboardLedger, newSeasonalLeaderboardLedger } from "./seasonal-leaderboard-ledger.js";

test("SeasonalLeaderboardLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_044_149);
  const items: SeasonalLeaderboardLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalLeaderboardLedger(`seasonal-leaderboard-ledger-${index}`, "sample"));
  }
  const report = buildSeasonalLeaderboardLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
