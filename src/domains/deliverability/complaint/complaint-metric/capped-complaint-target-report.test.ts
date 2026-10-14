import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedComplaintTargetReport } from "./capped-complaint-target-report.js";
import { CappedComplaintTarget, newCappedComplaintTarget } from "./capped-complaint-target.js";

test("CappedComplaintTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_690_161);
  const items: CappedComplaintTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedComplaintTarget(`capped-complaint-target-${index}`, "sample"));
  }
  const report = buildCappedComplaintTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
