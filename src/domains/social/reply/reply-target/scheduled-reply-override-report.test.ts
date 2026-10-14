import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledReplyOverrideReport } from "./scheduled-reply-override-report.js";
import { ScheduledReplyOverride, newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("ScheduledReplyOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_914_591);
  const items: ScheduledReplyOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledReplyOverride(`scheduled-reply-override-${index}`, "sample"));
  }
  const report = buildScheduledReplyOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
