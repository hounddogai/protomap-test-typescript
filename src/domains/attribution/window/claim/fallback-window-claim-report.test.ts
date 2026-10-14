import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackWindowClaimReport } from "./fallback-window-claim-report.js";
import { FallbackWindowClaim, newFallbackWindowClaim } from "./fallback-window-claim.js";

test("FallbackWindowClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_631_918);
  const items: FallbackWindowClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackWindowClaim(`fallback-window-claim-${index}`, "sample"));
  }
  const report = buildFallbackWindowClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
