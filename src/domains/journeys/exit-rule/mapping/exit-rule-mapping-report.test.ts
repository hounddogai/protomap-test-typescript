import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleMappingReport } from "./exit-rule-mapping-report.js";
import { ExitRuleMapping, newExitRuleMapping } from "./exit-rule-mapping.js";

test("ExitRuleMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_693_529);
  const items: ExitRuleMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newExitRuleMapping(`exit-rule-mapping-${index}`, "sample"));
  }
  const report = buildExitRuleMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
