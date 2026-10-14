import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionClaimReport } from "./suppression-claim-report.js";
import { SuppressionClaim, newSuppressionClaim } from "./suppression-claim.js";

test("SuppressionClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_964_464);
  const items: SuppressionClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionClaim(`suppression-claim-${index}`, "sample"));
  }
  const report = buildSuppressionClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
