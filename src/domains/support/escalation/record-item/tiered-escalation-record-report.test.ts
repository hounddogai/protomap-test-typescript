import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredEscalationRecordReport } from "./tiered-escalation-record-report.js";
import { TieredEscalationRecord, newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("TieredEscalationRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_666_567);
  const items: TieredEscalationRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredEscalationRecord(`tiered-escalation-record-${index}`, "sample"));
  }
  const report = buildTieredEscalationRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
