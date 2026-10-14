import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientReputationRuleReport } from "./lenient-reputation-rule-report.js";
import { LenientReputationRule, newLenientReputationRule } from "./lenient-reputation-rule.js";

test("LenientReputationRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_013_203);
  const items: LenientReputationRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientReputationRule(`lenient-reputation-rule-${index}`, "sample"));
  }
  const report = buildLenientReputationRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
