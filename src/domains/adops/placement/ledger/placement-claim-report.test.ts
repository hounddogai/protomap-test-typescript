import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementClaimReport } from "./placement-claim-report.js";
import { PlacementClaim, newPlacementClaim } from "./placement-claim.js";

test("PlacementClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_700_762);
  const items: PlacementClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPlacementClaim(`placement-claim-${index}`, "sample"));
  }
  const report = buildPlacementClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
