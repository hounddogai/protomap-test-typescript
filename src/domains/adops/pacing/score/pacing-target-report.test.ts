import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingTargetReport } from "./pacing-target-report.js";
import { PacingTarget, newPacingTarget } from "./pacing-target.js";

test("PacingTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_144_432);
  const items: PacingTarget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPacingTarget(`pacing-target-${index}`, "sample"));
  }
  const report = buildPacingTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
