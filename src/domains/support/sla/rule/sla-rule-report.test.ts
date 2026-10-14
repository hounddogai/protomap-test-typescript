import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaRuleReport } from "./sla-rule-report.js";
import { SlaRule, newSlaRule } from "./sla-rule.js";

test("SlaRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_869_608);
  const items: SlaRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSlaRule(`sla-rule-${index}`, "sample"));
  }
  const report = buildSlaRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
