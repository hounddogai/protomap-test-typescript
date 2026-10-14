import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictModelRecordReport } from "./strict-model-record-report.js";
import { StrictModelRecord, newStrictModelRecord } from "./strict-model-record.js";

test("StrictModelRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_912_590);
  const items: StrictModelRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictModelRecord(`strict-model-record-${index}`, "sample"));
  }
  const report = buildStrictModelRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
