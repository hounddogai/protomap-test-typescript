import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleGroupReport } from "./exit-rule-group-report.js";
import { ExitRuleGroup, newExitRuleGroup } from "./exit-rule-group.js";

test("ExitRuleGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_246_061);
  const items: ExitRuleGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newExitRuleGroup(`exit-rule-group-${index}`, "sample"));
  }
  const report = buildExitRuleGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
