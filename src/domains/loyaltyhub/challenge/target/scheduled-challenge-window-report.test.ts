import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledChallengeWindowReport } from "./scheduled-challenge-window-report.js";
import { ScheduledChallengeWindow, newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

test("ScheduledChallengeWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_105_248);
  const items: ScheduledChallengeWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledChallengeWindow(`scheduled-challenge-window-${index}`, "sample"));
  }
  const report = buildScheduledChallengeWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
