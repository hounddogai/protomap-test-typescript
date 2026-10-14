import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTierRuleReport } from "./manual-tier-rule-report.js";
import { ManualTierRule, newManualTierRule } from "./manual-tier-rule.js";

test("ManualTierRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_347_105);
  const items: ManualTierRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualTierRule(`manual-tier-rule-${index}`, "sample"));
  }
  const report = buildManualTierRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
