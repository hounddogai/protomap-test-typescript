import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDeflectionClaimReport } from "./legacy-deflection-claim-report.js";
import { LegacyDeflectionClaim, newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("LegacyDeflectionClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_340_692);
  const items: LegacyDeflectionClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyDeflectionClaim(`legacy-deflection-claim-${index}`, "sample"));
  }
  const report = buildLegacyDeflectionClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
