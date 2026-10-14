import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingNudgeTargetReport } from "./rolling-nudge-target-report.js";
import { RollingNudgeTarget, newRollingNudgeTarget } from "./rolling-nudge-target.js";

test("RollingNudgeTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_845_775);
  const items: RollingNudgeTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingNudgeTarget(`rolling-nudge-target-${index}`, "sample"));
  }
  const report = buildRollingNudgeTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
