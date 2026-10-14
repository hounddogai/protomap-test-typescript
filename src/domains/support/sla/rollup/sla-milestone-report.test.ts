import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaMilestoneReport } from "./sla-milestone-report.js";
import { SlaMilestone, newSlaMilestone } from "./sla-milestone.js";

test("SlaMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_592_018);
  const items: SlaMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSlaMilestone(`sla-milestone-${index}`, "sample"));
  }
  const report = buildSlaMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
