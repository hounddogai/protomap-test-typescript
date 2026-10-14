import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeScheduleView, toChallengeScheduleViews } from "./challenge-schedule-view.js";
import { newChallengeSchedule } from "./challenge-schedule.js";

test("ChallengeScheduleView shows the status in capitals", () => {
  const item = newChallengeSchedule("code-435", "label-632");
  const view = toChallengeScheduleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeScheduleViews([item, item]).length, 2, "views");
});
