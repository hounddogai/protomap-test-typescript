import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyMentionRuleReport } from "./legacy-mention-rule-report.js";
import { LegacyMentionRule, newLegacyMentionRule } from "./legacy-mention-rule.js";

test("LegacyMentionRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_641_355);
  const items: LegacyMentionRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyMentionRule(`legacy-mention-rule-${index}`, "sample"));
  }
  const report = buildLegacyMentionRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
