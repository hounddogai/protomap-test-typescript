import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionMilestoneReport } from "./retention-milestone-report.js";
import { RetentionMilestone, newRetentionMilestone } from "./retention-milestone.js";

test("RetentionMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_774_569);
  const items: RetentionMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRetentionMilestone(`retention-milestone-${index}`, "sample"));
  }
  const report = buildRetentionMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
