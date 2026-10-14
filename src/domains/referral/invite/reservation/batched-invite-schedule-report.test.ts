import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedInviteScheduleReport } from "./batched-invite-schedule-report.js";
import { BatchedInviteSchedule, newBatchedInviteSchedule } from "./batched-invite-schedule.js";

test("BatchedInviteScheduleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_461_085);
  const items: BatchedInviteSchedule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedInviteSchedule(`batched-invite-schedule-${index}`, "sample"));
  }
  const report = buildBatchedInviteScheduleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
