import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveOptOutRecordReport } from "./adaptive-opt-out-record-report.js";
import { AdaptiveOptOutRecord, newAdaptiveOptOutRecord } from "./adaptive-opt-out-record.js";

test("AdaptiveOptOutRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_210_411);
  const items: AdaptiveOptOutRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveOptOutRecord(`adaptive-opt-out-record-${index}`, "sample"));
  }
  const report = buildAdaptiveOptOutRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
