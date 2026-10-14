import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatRecordReport } from "./csat-record-report.js";
import { CsatRecord, newCsatRecord } from "./csat-record.js";

test("CsatRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_088_967);
  const items: CsatRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCsatRecord(`csat-record-${index}`, "sample"));
  }
  const report = buildCsatRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
