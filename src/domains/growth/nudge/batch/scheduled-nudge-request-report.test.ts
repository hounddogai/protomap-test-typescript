import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledNudgeRequestReport } from "./scheduled-nudge-request-report.js";
import { ScheduledNudgeRequest, newScheduledNudgeRequest } from "./scheduled-nudge-request.js";

test("ScheduledNudgeRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_278_676);
  const items: ScheduledNudgeRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledNudgeRequest(`scheduled-nudge-request-${index}`, "sample"));
  }
  const report = buildScheduledNudgeRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
