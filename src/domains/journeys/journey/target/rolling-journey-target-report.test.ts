import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneyTargetReport } from "./rolling-journey-target-report.js";
import { RollingJourneyTarget, newRollingJourneyTarget } from "./rolling-journey-target.js";

test("RollingJourneyTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_883_295);
  const items: RollingJourneyTarget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingJourneyTarget(`rolling-journey-target-${index}`, "sample"));
  }
  const report = buildRollingJourneyTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
