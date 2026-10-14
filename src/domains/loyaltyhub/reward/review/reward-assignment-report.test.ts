import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardAssignmentReport } from "./reward-assignment-report.js";
import { RewardAssignment, newRewardAssignment } from "./reward-assignment.js";

test("RewardAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_658_786);
  const items: RewardAssignment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardAssignment(`reward-assignment-${index}`, "sample"));
  }
  const report = buildRewardAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
