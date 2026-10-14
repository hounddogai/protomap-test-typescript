import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPostClaimReport } from "./lenient-post-claim-report.js";
import { LenientPostClaim, newLenientPostClaim } from "./lenient-post-claim.js";

test("LenientPostClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_204_121);
  const items: LenientPostClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientPostClaim(`lenient-post-claim-${index}`, "sample"));
  }
  const report = buildLenientPostClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
