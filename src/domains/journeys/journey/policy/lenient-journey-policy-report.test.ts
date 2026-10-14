import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientJourneyPolicyReport } from "./lenient-journey-policy-report.js";
import { LenientJourneyPolicy, newLenientJourneyPolicy } from "./lenient-journey-policy.js";

test("LenientJourneyPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_888_397);
  const items: LenientJourneyPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientJourneyPolicy(`lenient-journey-policy-${index}`, "sample"));
  }
  const report = buildLenientJourneyPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
