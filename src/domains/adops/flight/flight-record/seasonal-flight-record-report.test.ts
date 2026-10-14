import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalFlightRecordReport } from "./seasonal-flight-record-report.js";
import { SeasonalFlightRecord, newSeasonalFlightRecord } from "./seasonal-flight-record.js";

test("SeasonalFlightRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_353_168);
  const items: SeasonalFlightRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalFlightRecord(`seasonal-flight-record-${index}`, "sample"));
  }
  const report = buildSeasonalFlightRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
