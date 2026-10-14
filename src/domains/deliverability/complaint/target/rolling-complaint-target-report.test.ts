import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingComplaintTargetReport } from "./rolling-complaint-target-report.js";
import { RollingComplaintTarget, newRollingComplaintTarget } from "./rolling-complaint-target.js";

test("RollingComplaintTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_890_782);
  const items: RollingComplaintTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingComplaintTarget(`rolling-complaint-target-${index}`, "sample"));
  }
  const report = buildRollingComplaintTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
