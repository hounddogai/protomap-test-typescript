import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitRuleReport } from "./wait-rule-report.js";
import { WaitRule, newWaitRule } from "./wait-rule.js";

test("WaitRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_421_779);
  const items: WaitRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWaitRule(`wait-rule-${index}`, "sample"));
  }
  const report = buildWaitRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
