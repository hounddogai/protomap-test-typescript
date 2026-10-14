import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionRecordReport } from "./deflection-record-report.js";
import { DeflectionRecord, newDeflectionRecord } from "./deflection-record.js";

test("DeflectionRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_751_852);
  const items: DeflectionRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDeflectionRecord(`deflection-record-${index}`, "sample"));
  }
  const report = buildDeflectionRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
