import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationRuleReport } from "./activation-rule-report.js";
import { ActivationRule, newActivationRule } from "./activation-rule.js";

test("ActivationRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_468_948);
  const items: ActivationRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newActivationRule(`activation-rule-${index}`, "sample"));
  }
  const report = buildActivationRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
