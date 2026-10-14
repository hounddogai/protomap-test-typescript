import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedReplyRecordReport } from "./weighted-reply-record-report.js";
import { WeightedReplyRecord, newWeightedReplyRecord } from "./weighted-reply-record.js";

test("WeightedReplyRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_272_142);
  const items: WeightedReplyRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedReplyRecord(`weighted-reply-record-${index}`, "sample"));
  }
  const report = buildWeightedReplyRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
