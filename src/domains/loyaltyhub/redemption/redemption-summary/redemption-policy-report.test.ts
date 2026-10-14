import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionPolicyReport } from "./redemption-policy-report.js";
import { RedemptionPolicy, newRedemptionPolicy } from "./redemption-policy.js";

test("RedemptionPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_843_970);
  const items: RedemptionPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRedemptionPolicy(`redemption-policy-${index}`, "sample"));
  }
  const report = buildRedemptionPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
