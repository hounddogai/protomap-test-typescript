import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualReplyVarianceReport } from "./manual-reply-variance-report.js";
import { ManualReplyVariance, newManualReplyVariance } from "./manual-reply-variance.js";

test("ManualReplyVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_553_491);
  const items: ManualReplyVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualReplyVariance(`manual-reply-variance-${index}`, "sample"));
  }
  const report = buildManualReplyVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
