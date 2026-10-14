import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleTargetReport } from "./exit-rule-target-report.js";
import { ExitRuleTarget, newExitRuleTarget } from "./exit-rule-target.js";

test("ExitRuleTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_374_624);
  const items: ExitRuleTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newExitRuleTarget(`exit-rule-target-${index}`, "sample"));
  }
  const report = buildExitRuleTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
