import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentRuleReport } from "./enrollment-rule-report.js";
import { EnrollmentRule, newEnrollmentRule } from "./enrollment-rule.js";

test("EnrollmentRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_799_145);
  const items: EnrollmentRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newEnrollmentRule(`enrollment-rule-${index}`, "sample"));
  }
  const report = buildEnrollmentRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
