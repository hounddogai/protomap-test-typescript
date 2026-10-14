import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTierRecordReport } from "./capped-tier-record-report.js";
import { CappedTierRecord, newCappedTierRecord } from "./capped-tier-record.js";

test("CappedTierRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_343_804);
  const items: CappedTierRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedTierRecord(`capped-tier-record-${index}`, "sample"));
  }
  const report = buildCappedTierRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
