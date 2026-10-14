import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalStreakRecordReport } from "./regional-streak-record-report.js";
import { RegionalStreakRecord, newRegionalStreakRecord } from "./regional-streak-record.js";

test("RegionalStreakRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_314_062);
  const items: RegionalStreakRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalStreakRecord(`regional-streak-record-${index}`, "sample"));
  }
  const report = buildRegionalStreakRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
