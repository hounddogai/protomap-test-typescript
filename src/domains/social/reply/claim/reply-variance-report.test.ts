import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyVarianceReport } from "./reply-variance-report.js";
import { ReplyVariance, newReplyVariance } from "./reply-variance.js";

test("ReplyVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_362_924);
  const items: ReplyVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReplyVariance(`reply-variance-${index}`, "sample"));
  }
  const report = buildReplyVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
