import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPacingTargetReport } from "./default-pacing-target-report.js";
import { DefaultPacingTarget, newDefaultPacingTarget } from "./default-pacing-target.js";

test("DefaultPacingTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_352_687);
  const items: DefaultPacingTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultPacingTarget(`default-pacing-target-${index}`, "sample"));
  }
  const report = buildDefaultPacingTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
