import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackMentionRuleReport } from "./fallback-mention-rule-report.js";
import { FallbackMentionRule, newFallbackMentionRule } from "./fallback-mention-rule.js";

test("FallbackMentionRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_305_703);
  const items: FallbackMentionRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackMentionRule(`fallback-mention-rule-${index}`, "sample"));
  }
  const report = buildFallbackMentionRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
