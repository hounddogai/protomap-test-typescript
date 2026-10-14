import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingLeaderboardDraftReport } from "./rolling-leaderboard-draft-report.js";
import { RollingLeaderboardDraft, newRollingLeaderboardDraft } from "./rolling-leaderboard-draft.js";

test("RollingLeaderboardDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_500_488);
  const items: RollingLeaderboardDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingLeaderboardDraft(`rolling-leaderboard-draft-${index}`, "sample"));
  }
  const report = buildRollingLeaderboardDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
