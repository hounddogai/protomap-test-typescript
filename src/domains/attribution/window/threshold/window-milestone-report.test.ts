import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowMilestoneReport } from "./window-milestone-report.js";
import { WindowMilestone, newWindowMilestone } from "./window-milestone.js";

test("WindowMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_726_140);
  const items: WindowMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWindowMilestone(`window-milestone-${index}`, "sample"));
  }
  const report = buildWindowMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
