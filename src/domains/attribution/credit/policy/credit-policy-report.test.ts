import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditPolicyReport } from "./credit-policy-report.js";
import { CreditPolicy, newCreditPolicy } from "./credit-policy.js";

test("CreditPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_413_772);
  const items: CreditPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCreditPolicy(`credit-policy-${index}`, "sample"));
  }
  const report = buildCreditPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
