import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionMilestoneReport } from "./mention-milestone-report.js";
import { MentionMilestone, newMentionMilestone } from "./mention-milestone.js";

test("MentionMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_826_824);
  const items: MentionMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newMentionMilestone(`mention-milestone-${index}`, "sample"));
  }
  const report = buildMentionMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
