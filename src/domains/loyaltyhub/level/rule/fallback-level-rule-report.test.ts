import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackLevelRuleReport } from "./fallback-level-rule-report.js";
import { FallbackLevelRule, newFallbackLevelRule } from "./fallback-level-rule.js";

test("FallbackLevelRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_962_518);
  const items: FallbackLevelRule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackLevelRule(`fallback-level-rule-${index}`, "sample"));
  }
  const report = buildFallbackLevelRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
