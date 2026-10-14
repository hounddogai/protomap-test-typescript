import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPostRuleReport } from "./fallback-post-rule-report.js";
import { FallbackPostRule, newFallbackPostRule } from "./fallback-post-rule.js";

test("FallbackPostRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_851_422);
  const items: FallbackPostRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackPostRule(`fallback-post-rule-${index}`, "sample"));
  }
  const report = buildFallbackPostRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
