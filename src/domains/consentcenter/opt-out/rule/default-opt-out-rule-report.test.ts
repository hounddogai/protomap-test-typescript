import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultOptOutRuleReport } from "./default-opt-out-rule-report.js";
import { DefaultOptOutRule, newDefaultOptOutRule } from "./default-opt-out-rule.js";

test("DefaultOptOutRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_706_260);
  const items: DefaultOptOutRule[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultOptOutRule(`default-opt-out-rule-${index}`, "sample"));
  }
  const report = buildDefaultOptOutRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
