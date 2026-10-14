import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionRecordReport } from "./conversion-record-report.js";
import { ConversionRecord, newConversionRecord } from "./conversion-record.js";

test("ConversionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_393_534);
  const items: ConversionRecord[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newConversionRecord(`conversion-record-${index}`, "sample"));
  }
  const report = buildConversionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
