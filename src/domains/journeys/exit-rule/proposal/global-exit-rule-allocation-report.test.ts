import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalExitRuleAllocationReport } from "./global-exit-rule-allocation-report.js";
import { GlobalExitRuleAllocation, newGlobalExitRuleAllocation } from "./global-exit-rule-allocation.js";

test("GlobalExitRuleAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_380_435);
  const items: GlobalExitRuleAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalExitRuleAllocation(`global-exit-rule-allocation-${index}`, "sample"));
  }
  const report = buildGlobalExitRuleAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
