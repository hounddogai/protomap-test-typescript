import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalExitRuleBaselineReport } from "./regional-exit-rule-baseline-report.js";
import { RegionalExitRuleBaseline, newRegionalExitRuleBaseline } from "./regional-exit-rule-baseline.js";

test("RegionalExitRuleBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_128_456);
  const items: RegionalExitRuleBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalExitRuleBaseline(`regional-exit-rule-baseline-${index}`, "sample"));
  }
  const report = buildRegionalExitRuleBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
