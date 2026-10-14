import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledPacingTargetReport } from "./scheduled-pacing-target-report.js";
import { ScheduledPacingTarget, newScheduledPacingTarget } from "./scheduled-pacing-target.js";

test("ScheduledPacingTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_576_541);
  const items: ScheduledPacingTarget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledPacingTarget(`scheduled-pacing-target-${index}`, "sample"));
  }
  const report = buildScheduledPacingTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
