import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingNudgeNoticeReport } from "./rolling-nudge-notice-report.js";
import { RollingNudgeNotice, newRollingNudgeNotice } from "./rolling-nudge-notice.js";

test("RollingNudgeNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_384_138);
  const items: RollingNudgeNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingNudgeNotice(`rolling-nudge-notice-${index}`, "sample"));
  }
  const report = buildRollingNudgeNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
