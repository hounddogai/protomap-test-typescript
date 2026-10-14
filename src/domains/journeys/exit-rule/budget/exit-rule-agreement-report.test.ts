import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleAgreementReport } from "./exit-rule-agreement-report.js";
import { ExitRuleAgreement, newExitRuleAgreement } from "./exit-rule-agreement.js";

test("ExitRuleAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_986_251);
  const items: ExitRuleAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newExitRuleAgreement(`exit-rule-agreement-${index}`, "sample"));
  }
  const report = buildExitRuleAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
