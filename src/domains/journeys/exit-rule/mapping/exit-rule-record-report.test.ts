import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleRecordReport } from "./exit-rule-record-report.js";
import { ExitRuleRecord, newExitRuleRecord } from "./exit-rule-record.js";

test("ExitRuleRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_991_718);
  const items: ExitRuleRecord[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newExitRuleRecord(`exit-rule-record-${index}`, "sample"));
  }
  const report = buildExitRuleRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
