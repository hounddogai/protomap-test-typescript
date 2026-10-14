import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowRuleReport } from "./window-rule-report.js";
import { WindowRule, newWindowRule } from "./window-rule.js";

test("WindowRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_586_442);
  const items: WindowRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWindowRule(`window-rule-${index}`, "sample"));
  }
  const report = buildWindowRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
