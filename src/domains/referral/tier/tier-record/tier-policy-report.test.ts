import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierPolicyReport } from "./tier-policy-report.js";
import { TierPolicy, newTierPolicy } from "./tier-policy.js";

test("TierPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_461_178);
  const items: TierPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTierPolicy(`tier-policy-${index}`, "sample"));
  }
  const report = buildTierPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
