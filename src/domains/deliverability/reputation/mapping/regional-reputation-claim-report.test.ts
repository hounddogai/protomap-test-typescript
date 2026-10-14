import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalReputationClaimReport } from "./regional-reputation-claim-report.js";
import { RegionalReputationClaim, newRegionalReputationClaim } from "./regional-reputation-claim.js";

test("RegionalReputationClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_564_257);
  const items: RegionalReputationClaim[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalReputationClaim(`regional-reputation-claim-${index}`, "sample"));
  }
  const report = buildRegionalReputationClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
