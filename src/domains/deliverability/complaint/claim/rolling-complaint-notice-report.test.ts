import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingComplaintNoticeReport } from "./rolling-complaint-notice-report.js";
import { RollingComplaintNotice, newRollingComplaintNotice } from "./rolling-complaint-notice.js";

test("RollingComplaintNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_751_473);
  const items: RollingComplaintNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingComplaintNotice(`rolling-complaint-notice-${index}`, "sample"));
  }
  const report = buildRollingComplaintNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
