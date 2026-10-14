import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFrequencyRecordReport } from "./default-frequency-record-report.js";
import { DefaultFrequencyRecord, newDefaultFrequencyRecord } from "./default-frequency-record.js";

test("DefaultFrequencyRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_168_751);
  const items: DefaultFrequencyRecord[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultFrequencyRecord(`default-frequency-record-${index}`, "sample"));
  }
  const report = buildDefaultFrequencyRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
