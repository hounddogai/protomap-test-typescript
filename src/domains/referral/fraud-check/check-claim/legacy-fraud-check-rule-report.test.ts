import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyFraudCheckRuleReport } from "./legacy-fraud-check-rule-report.js";
import { LegacyFraudCheckRule, newLegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

test("LegacyFraudCheckRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_266_341);
  const items: LegacyFraudCheckRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyFraudCheckRule(`legacy-fraud-check-rule-${index}`, "sample"));
  }
  const report = buildLegacyFraudCheckRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
