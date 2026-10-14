import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyCohortClaimReport } from "./legacy-cohort-claim-report.js";
import { LegacyCohortClaim, newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("LegacyCohortClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_646_146);
  const items: LegacyCohortClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyCohortClaim(`legacy-cohort-claim-${index}`, "sample"));
  }
  const report = buildLegacyCohortClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
