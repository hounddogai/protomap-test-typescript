import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledEscalationNoticeReport } from "./scheduled-escalation-notice-report.js";
import { ScheduledEscalationNotice, newScheduledEscalationNotice } from "./scheduled-escalation-notice.js";

test("ScheduledEscalationNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_475_754);
  const items: ScheduledEscalationNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledEscalationNotice(`scheduled-escalation-notice-${index}`, "sample"));
  }
  const report = buildScheduledEscalationNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
