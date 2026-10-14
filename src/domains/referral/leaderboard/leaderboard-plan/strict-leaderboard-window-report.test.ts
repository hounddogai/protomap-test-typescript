import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictLeaderboardWindowReport } from "./strict-leaderboard-window-report.js";
import { StrictLeaderboardWindow, newStrictLeaderboardWindow } from "./strict-leaderboard-window.js";

test("StrictLeaderboardWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_795_072);
  const items: StrictLeaderboardWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictLeaderboardWindow(`strict-leaderboard-window-${index}`, "sample"));
  }
  const report = buildStrictLeaderboardWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
