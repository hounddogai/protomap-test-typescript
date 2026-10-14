import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackOptOutRuleReport } from "./fallback-opt-out-rule-report.js";
import { FallbackOptOutRule, newFallbackOptOutRule } from "./fallback-opt-out-rule.js";

test("FallbackOptOutRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_616_083);
  const items: FallbackOptOutRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackOptOutRule(`fallback-opt-out-rule-${index}`, "sample"));
  }
  const report = buildFallbackOptOutRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
