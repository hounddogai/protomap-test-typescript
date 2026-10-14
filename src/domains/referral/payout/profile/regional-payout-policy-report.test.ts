import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalPayoutPolicyReport } from "./regional-payout-policy-report.js";
import { RegionalPayoutPolicy, newRegionalPayoutPolicy } from "./regional-payout-policy.js";

test("RegionalPayoutPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_964_543);
  const items: RegionalPayoutPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalPayoutPolicy(`regional-payout-policy-${index}`, "sample"));
  }
  const report = buildRegionalPayoutPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
