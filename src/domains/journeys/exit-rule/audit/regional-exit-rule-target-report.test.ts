import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalExitRuleTargetReport } from "./regional-exit-rule-target-report.js";
import { RegionalExitRuleTarget, newRegionalExitRuleTarget } from "./regional-exit-rule-target.js";

test("RegionalExitRuleTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_223_099);
  const items: RegionalExitRuleTarget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalExitRuleTarget(`regional-exit-rule-target-${index}`, "sample"));
  }
  const report = buildRegionalExitRuleTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
