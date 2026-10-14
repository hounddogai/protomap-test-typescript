import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierRecordReport } from "./tier-record-report.js";
import { TierRecord, newTierRecord } from "./tier-record.js";

test("TierRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_480_997);
  const items: TierRecord[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTierRecord(`tier-record-${index}`, "sample"));
  }
  const report = buildTierRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
