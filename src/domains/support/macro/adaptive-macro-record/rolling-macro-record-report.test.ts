import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingMacroRecordReport } from "./rolling-macro-record-report.js";
import { RollingMacroRecord, newRollingMacroRecord } from "./rolling-macro-record.js";

test("RollingMacroRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_839_784);
  const items: RollingMacroRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingMacroRecord(`rolling-macro-record-${index}`, "sample"));
  }
  const report = buildRollingMacroRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
