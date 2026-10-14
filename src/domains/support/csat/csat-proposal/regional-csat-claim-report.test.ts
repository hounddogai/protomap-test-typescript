import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalCsatClaimReport } from "./regional-csat-claim-report.js";
import { RegionalCsatClaim, newRegionalCsatClaim } from "./regional-csat-claim.js";

test("RegionalCsatClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_825_549);
  const items: RegionalCsatClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalCsatClaim(`regional-csat-claim-${index}`, "sample"));
  }
  const report = buildRegionalCsatClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
