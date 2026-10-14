import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSlaRuleReport } from "./scheduled-sla-rule-report.js";
import { ScheduledSlaRule, newScheduledSlaRule } from "./scheduled-sla-rule.js";

test("ScheduledSlaRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_684_978);
  const items: ScheduledSlaRule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledSlaRule(`scheduled-sla-rule-${index}`, "sample"));
  }
  const report = buildScheduledSlaRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
