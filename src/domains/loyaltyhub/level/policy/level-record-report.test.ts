import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelRecordReport } from "./level-record-report.js";
import { LevelRecord, newLevelRecord } from "./level-record.js";

test("LevelRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_033_742);
  const items: LevelRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLevelRecord(`level-record-${index}`, "sample"));
  }
  const report = buildLevelRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
