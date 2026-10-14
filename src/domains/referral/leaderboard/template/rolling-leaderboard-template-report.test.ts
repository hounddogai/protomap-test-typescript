import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingLeaderboardTemplateReport } from "./rolling-leaderboard-template-report.js";
import { RollingLeaderboardTemplate, newRollingLeaderboardTemplate } from "./rolling-leaderboard-template.js";

test("RollingLeaderboardTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_036_885);
  const items: RollingLeaderboardTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingLeaderboardTemplate(`rolling-leaderboard-template-${index}`, "sample"));
  }
  const report = buildRollingLeaderboardTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
