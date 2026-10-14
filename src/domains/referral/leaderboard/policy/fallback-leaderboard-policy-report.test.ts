import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackLeaderboardPolicyReport } from "./fallback-leaderboard-policy-report.js";
import { FallbackLeaderboardPolicy, newFallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

test("FallbackLeaderboardPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_293_983);
  const items: FallbackLeaderboardPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackLeaderboardPolicy(`fallback-leaderboard-policy-${index}`, "sample"));
  }
  const report = buildFallbackLeaderboardPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
