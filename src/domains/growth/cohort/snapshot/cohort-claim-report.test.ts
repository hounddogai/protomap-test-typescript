import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortClaimReport } from "./cohort-claim-report.js";
import { CohortClaim, newCohortClaim } from "./cohort-claim.js";

test("CohortClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_204_145);
  const items: CohortClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCohortClaim(`cohort-claim-${index}`, "sample"));
  }
  const report = buildCohortClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
