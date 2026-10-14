import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostRecordReport } from "./post-record-report.js";
import { PostRecord, newPostRecord } from "./post-record.js";

test("PostRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_463_822);
  const items: PostRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPostRecord(`post-record-${index}`, "sample"));
  }
  const report = buildPostRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
