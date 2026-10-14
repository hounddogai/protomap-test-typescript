import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualLeaderboardDraftReport } from "./manual-leaderboard-draft-report.js";
import { ManualLeaderboardDraft, newManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

test("ManualLeaderboardDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_776_632);
  const items: ManualLeaderboardDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualLeaderboardDraft(`manual-leaderboard-draft-${index}`, "sample"));
  }
  const report = buildManualLeaderboardDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
