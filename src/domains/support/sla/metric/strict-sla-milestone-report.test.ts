import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictSlaMilestoneReport } from "./strict-sla-milestone-report.js";
import { StrictSlaMilestone, newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("StrictSlaMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_396_610);
  const items: StrictSlaMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictSlaMilestone(`strict-sla-milestone-${index}`, "sample"));
  }
  const report = buildStrictSlaMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
