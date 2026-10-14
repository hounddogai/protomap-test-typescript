import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledReplyExceptionReport } from "./scheduled-reply-exception-report.js";
import { ScheduledReplyException, newScheduledReplyException } from "./scheduled-reply-exception.js";

test("ScheduledReplyExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_574_823);
  const items: ScheduledReplyException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledReplyException(`scheduled-reply-exception-${index}`, "sample"));
  }
  const report = buildScheduledReplyExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
