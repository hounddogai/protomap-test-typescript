import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalStreakRecordReport } from "./global-streak-record-report.js";
import { GlobalStreakRecord, newGlobalStreakRecord } from "./global-streak-record.js";

test("GlobalStreakRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_005_271);
  const items: GlobalStreakRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalStreakRecord(`global-streak-record-${index}`, "sample"));
  }
  const report = buildGlobalStreakRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
