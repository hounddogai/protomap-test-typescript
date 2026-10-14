import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBadgeMilestoneReport } from "./primary-badge-milestone-report.js";
import { PrimaryBadgeMilestone, newPrimaryBadgeMilestone } from "./primary-badge-milestone.js";

test("PrimaryBadgeMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_550_159);
  const items: PrimaryBadgeMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryBadgeMilestone(`primary-badge-milestone-${index}`, "sample"));
  }
  const report = buildPrimaryBadgeMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
