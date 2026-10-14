import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyThresholdReport } from "./reply-threshold-report.js";
import { ReplyThreshold, newReplyThreshold } from "./reply-threshold.js";

test("ReplyThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_728_813);
  const items: ReplyThreshold[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newReplyThreshold(`reply-threshold-${index}`, "sample"));
  }
  const report = buildReplyThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
