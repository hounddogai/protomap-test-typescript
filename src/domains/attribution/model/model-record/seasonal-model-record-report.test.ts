import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalModelRecordReport } from "./seasonal-model-record-report.js";
import { SeasonalModelRecord, newSeasonalModelRecord } from "./seasonal-model-record.js";

test("SeasonalModelRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_444_739);
  const items: SeasonalModelRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalModelRecord(`seasonal-model-record-${index}`, "sample"));
  }
  const report = buildSeasonalModelRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
