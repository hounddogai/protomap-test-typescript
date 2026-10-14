import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryQueueRuleReport } from "./primary-queue-rule-report.js";
import { PrimaryQueueRule, newPrimaryQueueRule } from "./primary-queue-rule.js";

test("PrimaryQueueRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_797_206);
  const items: PrimaryQueueRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryQueueRule(`primary-queue-rule-${index}`, "sample"));
  }
  const report = buildPrimaryQueueRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
