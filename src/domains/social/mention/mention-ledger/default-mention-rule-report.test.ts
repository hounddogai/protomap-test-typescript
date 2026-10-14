import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultMentionRuleReport } from "./default-mention-rule-report.js";
import { DefaultMentionRule, newDefaultMentionRule } from "./default-mention-rule.js";

test("DefaultMentionRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_205_099);
  const items: DefaultMentionRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultMentionRule(`default-mention-rule-${index}`, "sample"));
  }
  const report = buildDefaultMentionRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
