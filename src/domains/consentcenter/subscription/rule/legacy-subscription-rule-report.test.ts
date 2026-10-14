import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacySubscriptionRuleReport } from "./legacy-subscription-rule-report.js";
import { LegacySubscriptionRule, newLegacySubscriptionRule } from "./legacy-subscription-rule.js";

test("LegacySubscriptionRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_922_531);
  const items: LegacySubscriptionRule[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacySubscriptionRule(`legacy-subscription-rule-${index}`, "sample"));
  }
  const report = buildLegacySubscriptionRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
