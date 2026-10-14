import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingJourneyPolicyReport } from "./rolling-journey-policy-report.js";
import { RollingJourneyPolicy, newRollingJourneyPolicy } from "./rolling-journey-policy.js";

test("RollingJourneyPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_942_042);
  const items: RollingJourneyPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingJourneyPolicy(`rolling-journey-policy-${index}`, "sample"));
  }
  const report = buildRollingJourneyPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
