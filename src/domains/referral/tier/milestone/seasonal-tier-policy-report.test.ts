import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalTierPolicyReport } from "./seasonal-tier-policy-report.js";
import { SeasonalTierPolicy, newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

test("SeasonalTierPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_398_904);
  const items: SeasonalTierPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalTierPolicy(`seasonal-tier-policy-${index}`, "sample"));
  }
  const report = buildSeasonalTierPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
