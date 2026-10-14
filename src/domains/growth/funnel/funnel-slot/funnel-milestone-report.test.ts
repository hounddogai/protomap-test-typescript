import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelMilestoneReport } from "./funnel-milestone-report.js";
import { FunnelMilestone, newFunnelMilestone } from "./funnel-milestone.js";

test("FunnelMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_873_737);
  const items: FunnelMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFunnelMilestone(`funnel-milestone-${index}`, "sample"));
  }
  const report = buildFunnelMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
