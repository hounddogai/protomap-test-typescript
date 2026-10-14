import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupRuleReport } from "./warmup-rule-report.js";
import { WarmupRule, newWarmupRule } from "./warmup-rule.js";

test("WarmupRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_745_820);
  const items: WarmupRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWarmupRule(`warmup-rule-${index}`, "sample"));
  }
  const report = buildWarmupRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
