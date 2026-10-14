import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySenderRuleReport } from "./primary-sender-rule-report.js";
import { PrimarySenderRule, newPrimarySenderRule } from "./primary-sender-rule.js";

test("PrimarySenderRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_881_151);
  const items: PrimarySenderRule[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimarySenderRule(`primary-sender-rule-${index}`, "sample"));
  }
  const report = buildPrimarySenderRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
