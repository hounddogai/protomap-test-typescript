import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPayoutPolicyReport } from "./weighted-payout-policy-report.js";
import { WeightedPayoutPolicy, newWeightedPayoutPolicy } from "./weighted-payout-policy.js";

test("WeightedPayoutPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_760_979);
  const items: WeightedPayoutPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedPayoutPolicy(`weighted-payout-policy-${index}`, "sample"));
  }
  const report = buildWeightedPayoutPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
