import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualComplaintTargetReport } from "./manual-complaint-target-report.js";
import { ManualComplaintTarget, newManualComplaintTarget } from "./manual-complaint-target.js";

test("ManualComplaintTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_508_538);
  const items: ManualComplaintTarget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualComplaintTarget(`manual-complaint-target-${index}`, "sample"));
  }
  const report = buildManualComplaintTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
