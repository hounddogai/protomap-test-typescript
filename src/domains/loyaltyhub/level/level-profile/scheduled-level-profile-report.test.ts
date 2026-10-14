import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledLevelProfileReport } from "./scheduled-level-profile-report.js";
import { ScheduledLevelProfile, newScheduledLevelProfile } from "./scheduled-level-profile.js";

test("ScheduledLevelProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_718_033);
  const items: ScheduledLevelProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledLevelProfile(`scheduled-level-profile-${index}`, "sample"));
  }
  const report = buildScheduledLevelProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
