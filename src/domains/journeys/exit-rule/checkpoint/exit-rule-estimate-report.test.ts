import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleEstimateReport } from "./exit-rule-estimate-report.js";
import { ExitRuleEstimate, newExitRuleEstimate } from "./exit-rule-estimate.js";

test("ExitRuleEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_604_741);
  const items: ExitRuleEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newExitRuleEstimate(`exit-rule-estimate-${index}`, "sample"));
  }
  const report = buildExitRuleEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
