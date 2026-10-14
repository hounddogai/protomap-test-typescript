import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupRecordReport } from "./warmup-record-report.js";
import { WarmupRecord, newWarmupRecord } from "./warmup-record.js";

test("WarmupRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_573_591);
  const items: WarmupRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWarmupRecord(`warmup-record-${index}`, "sample"));
  }
  const report = buildWarmupRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
