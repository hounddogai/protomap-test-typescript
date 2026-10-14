import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWarmupRecordReport } from "./lenient-warmup-record-report.js";
import { LenientWarmupRecord, newLenientWarmupRecord } from "./lenient-warmup-record.js";

test("LenientWarmupRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_979_236);
  const items: LenientWarmupRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientWarmupRecord(`lenient-warmup-record-${index}`, "sample"));
  }
  const report = buildLenientWarmupRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
