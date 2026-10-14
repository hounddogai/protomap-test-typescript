import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceClaimReport } from "./bounce-claim-report.js";
import { BounceClaim, newBounceClaim } from "./bounce-claim.js";

test("BounceClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_329_848);
  const items: BounceClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBounceClaim(`bounce-claim-${index}`, "sample"));
  }
  const report = buildBounceClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
