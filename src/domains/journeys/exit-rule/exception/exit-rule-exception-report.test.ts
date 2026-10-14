import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleExceptionReport } from "./exit-rule-exception-report.js";
import { ExitRuleException, newExitRuleException } from "./exit-rule-exception.js";

test("ExitRuleExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_306_724);
  const items: ExitRuleException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newExitRuleException(`exit-rule-exception-${index}`, "sample"));
  }
  const report = buildExitRuleExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
