import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeRecordReport } from "./creative-record-report.js";
import { CreativeRecord, newCreativeRecord } from "./creative-record.js";

test("CreativeRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_398_056);
  const items: CreativeRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCreativeRecord(`creative-record-${index}`, "sample"));
  }
  const report = buildCreativeRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
